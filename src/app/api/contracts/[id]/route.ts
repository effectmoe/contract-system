import { NextRequest, NextResponse } from 'next/server';
import { getContractService } from '@/lib/db/mongodb';
import { rateLimiter } from '@/lib/db/kv';
import { ERROR_MESSAGES } from '@/lib/utils/constants';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/contracts/[id] - Get single contract
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const contractService = await getContractService();
    const contract = await contractService['contracts'].findOne({ 
      contractId: params.id 
    });

    if (!contract) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.CONTRACT_NOT_FOUND },
        { status: 404 }
      );
    }

    // Log view action
    await contractService['auditLogs'].create({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action: 'viewed',
      performedBy: 'system', // TODO: Get from auth
      performedAt: new Date(),
      details: { contractId: params.id },
    });

    return NextResponse.json(contract);
  } catch (error) {
    console.error('Failed to fetch contract:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERIC },
      { status: 500 }
    );
  }
}

// PUT /api/contracts/[id] - Update contract
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const contractService = await getContractService();

    // Check if contract exists
    const existingContract = await contractService['contracts'].findOne({ 
      contractId: params.id 
    });

    if (!existingContract) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.CONTRACT_NOT_FOUND },
        { status: 404 }
      );
    }

    // Prevent updating completed contracts
    if (existingContract.status === 'completed') {
      return NextResponse.json(
        { error: '完了済みの契約は編集できません' },
        { status: 400 }
      );
    }

    // Update contract
    const updateData = {
      ...body,
      updatedAt: new Date(),
    };

    const result = await contractService['contracts'].update(
      { contractId: params.id },
      { $set: updateData }
    );

    if (!result) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.GENERIC },
        { status: 500 }
      );
    }

    // Log update action
    await contractService['auditLogs'].create({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action: 'updated',
      performedBy: 'system', // TODO: Get from auth
      performedAt: new Date(),
      details: { 
        contractId: params.id,
        changes: Object.keys(body)
      },
    });

    return NextResponse.json({ 
      message: ERROR_MESSAGES.CONTRACT_UPDATED,
      success: true 
    });
  } catch (error) {
    console.error('Failed to update contract:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERIC },
      { status: 500 }
    );
  }
}

// DELETE /api/contracts/[id] - Delete contract (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const contractService = await getContractService();

    // Check if contract exists
    const existingContract = await contractService['contracts'].findOne({ 
      contractId: params.id 
    });

    if (!existingContract) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.CONTRACT_NOT_FOUND },
        { status: 404 }
      );
    }

    // Don't allow deletion of completed contracts
    if (existingContract.status === 'completed') {
      return NextResponse.json(
        { error: '完了済みの契約は削除できません' },
        { status: 400 }
      );
    }

    // Soft delete by updating status
    const result = await contractService.updateContractStatus(
      params.id,
      'cancelled',
      'system' // TODO: Get from auth
    );

    if (!result) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.GENERIC },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: '契約がキャンセルされました',
      success: true 
    });
  } catch (error) {
    console.error('Failed to delete contract:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERIC },
      { status: 500 }
    );
  }
}