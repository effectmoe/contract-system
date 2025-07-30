import { NextRequest, NextResponse } from 'next/server';
import { Contract } from '@/types/contract';
import { rateLimiter } from '@/lib/db/kv';
import { ERROR_MESSAGES } from '@/lib/utils/constants';
import { getContractService, ContractSearchParams } from '@/lib/services/contract-service';

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
      sortBy: searchParams.get('sortBy') as keyof Contract || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
    };

    const contractService = getContractService();
    const result = await contractService.searchContracts(params);

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

    const contractService = getContractService();
    const newContract = await contractService.createContract(contract);

    return NextResponse.json(newContract, { status: 201 });
  } catch (error) {
    console.error('Failed to create contract:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERIC },
      { status: 500 }
    );
  }
}