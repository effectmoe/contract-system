import { NextRequest, NextResponse } from 'next/server';
import { getContractService } from '@/lib/db/mongodb';
import { Contract, ContractSearchParams } from '@/types/contract';
import { rateLimiter } from '@/lib/db/kv';
import { ERROR_MESSAGES } from '@/lib/utils/constants';
import { config } from '@/lib/config/env';
import { demoContracts } from '@/lib/db/demo-data';

// GET /api/contracts - Get all contracts with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed } = await rateLimiter.checkLimit(`api:${ip}`, 100, 60);
    
    if (!allowed) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.RATE_LIMIT },
        { status: 429 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const params: ContractSearchParams = {
      query: searchParams.get('q') || undefined,
      status: searchParams.get('status')?.split(',') as any || undefined,
      type: searchParams.get('type')?.split(',') as any || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
    };

    // Demo mode - return mock data
    if (config.isDemo) {
      const result = {
        data: demoContracts,
        pagination: {
          page: 1,
          limit: 20,
          total: demoContracts.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };
      return NextResponse.json(result);
    }

    const contractService = await getContractService();
    
    // Build filter
    const filter: any = {};
    if (params.status?.length) {
      filter.status = { $in: params.status };
    }
    if (params.type?.length) {
      filter.type = { $in: params.type };
    }

    const result = await contractService['contracts'].findMany(filter, {
      page: params.page,
      limit: params.limit,
      sort: { [params.sortBy!]: params.sortOrder === 'asc' ? 1 : -1 },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch contracts:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERIC },
      { status: 500 }
    );
  }
}

// POST /api/contracts - Create new contract
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed } = await rateLimiter.checkLimit(`api:${ip}`, 100, 60);
    
    if (!allowed) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.RATE_LIMIT },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // TODO: Add proper authentication
    const userId = 'system'; // Placeholder

    // Validate required fields
    if (!body.title || !body.content || !body.type) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.VALIDATION },
        { status: 400 }
      );
    }

    // Generate contract ID
    const contractId = `CNT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const contract: Contract = {
      contractId,
      title: body.title,
      description: body.description || '',
      content: body.content,
      parties: body.parties || [],
      status: 'draft',
      type: body.type,
      signatures: [],
      attachments: [],
      retentionPeriod: 7, // 7 years as per legal requirement
      searchableFields: [],
      auditLog: [],
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const contractService = await getContractService();
    const newContract = await contractService.createContract(contract, userId);

    return NextResponse.json(newContract, { status: 201 });
  } catch (error) {
    console.error('Failed to create contract:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERIC },
      { status: 500 }
    );
  }
}