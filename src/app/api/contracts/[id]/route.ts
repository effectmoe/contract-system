import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter } from '@/lib/db/kv';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/utils/constants';
import { getContractService } from '@/lib/services/contract-service';

// GET /api/contracts/[id] - Get single contract
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    
    const contractService = getContractService();
    const contract = await contractService.getContract(id);

    if (!contract) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.CONTRACT_NOT_FOUND },
        { status: 404 }
      );
    }

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
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const contractService = getContractService();

    // Update contract using service layer
    const updatedContract = await contractService.updateContract(id, body);

    if (!updatedContract) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.CONTRACT_NOT_FOUND },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: SUCCESS_MESSAGES.CONTRACT_UPDATED,
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

// PATCH /api/contracts/[id] - Partial update contract (used by edit page)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    
    const contractService = getContractService();

    // Update contract using service layer
    const updatedContract = await contractService.updateContract(id, body);

    if (!updatedContract) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.CONTRACT_NOT_FOUND },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: SUCCESS_MESSAGES.CONTRACT_UPDATED,
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
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    
    const contractService = getContractService();

    // Delete contract using service layer
    const deleted = await contractService.deleteContract(id);

    if (!deleted) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.CONTRACT_NOT_FOUND },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: '契約書が削除されました',
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