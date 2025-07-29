import { NextRequest, NextResponse } from 'next/server';
import { getContractService } from '@/lib/db/mongodb';
import { rateLimiter } from '@/lib/db/kv';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/utils/constants';
import { config } from '@/lib/config/env';
import { demoContracts } from '@/lib/db/demo-data';

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
    
    // Demo mode - return mock data
    const isActuallyDemo = !process.env.MONGODB_URI || process.env.MONGODB_URI === 'demo-mode' || process.env.MONGODB_URI.includes('your-cluster');
    
    if (config.isDemo || isActuallyDemo) {
      const contract = demoContracts.find(c => c.contractId === id);
      
      if (!contract) {
        return NextResponse.json(
          { error: ERROR_MESSAGES.CONTRACT_NOT_FOUND },
          { status: 404 }
        );
      }
      
      return NextResponse.json(contract);
    }
    
    const contractService = await getContractService();
    const contract = await contractService['contracts'].findOne({ 
      contractId: id 
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
      details: { contractId: id },
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
    const contractService = await getContractService();

    // Check if contract exists
    const existingContract = await contractService['contracts'].findOne({ 
      contractId: id 
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
      { contractId: id },
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
        contractId: id,
        changes: Object.keys(body)
      },
    });

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
    
    // Demo mode - simulate update
    const isActuallyDemo = !process.env.MONGODB_URI || process.env.MONGODB_URI === 'demo-mode' || process.env.MONGODB_URI.includes('your-cluster');
    
    if (config.isDemo || isActuallyDemo) {
      const contractIndex = demoContracts.findIndex(c => c.contractId === id);
      
      if (contractIndex === -1) {
        return NextResponse.json(
          { error: ERROR_MESSAGES.CONTRACT_NOT_FOUND },
          { status: 404 }
        );
      }

      const contract = demoContracts[contractIndex];

      // Prevent updating completed contracts
      if (contract.status === 'completed') {
        return NextResponse.json(
          { error: '完了済みの契約は編集できません' },
          { status: 400 }
        );
      }

      // Only allow updating draft contracts
      if (contract.status !== 'draft') {
        return NextResponse.json(
          { error: '編集できるのは下書き状態の契約書のみです' },
          { status: 400 }
        );
      }

      // Simulate update in demo mode (won't persist)
      const updatedContract = {
        ...contract,
        ...body,
        updatedAt: new Date(),
      };

      // In demo mode, just return success without actually updating
      return NextResponse.json({ 
        message: SUCCESS_MESSAGES.CONTRACT_UPDATED,
        success: true,
        contract: updatedContract
      });
    }
    
    const contractService = await getContractService();

    // Check if contract exists
    const existingContract = await contractService['contracts'].findOne({ 
      contractId: id 
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

    // Only allow updating draft contracts
    if (existingContract.status !== 'draft') {
      return NextResponse.json(
        { error: '編集できるのは下書き状態の契約書のみです' },
        { status: 400 }
      );
    }

    // Update contract
    const updateData = {
      ...body,
      updatedAt: new Date(),
    };

    const result = await contractService['contracts'].update(
      { contractId: id },
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
        contractId: id,
        changes: Object.keys(body)
      },
    });

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
    
    // Demo mode - simulate deletion
    const isActuallyDemo = !process.env.MONGODB_URI || process.env.MONGODB_URI === 'demo-mode' || process.env.MONGODB_URI.includes('your-cluster');
    
    if (config.isDemo || isActuallyDemo) {
      const contractIndex = demoContracts.findIndex(c => c.contractId === id);
      
      if (contractIndex === -1) {
        return NextResponse.json(
          { error: ERROR_MESSAGES.CONTRACT_NOT_FOUND },
          { status: 404 }
        );
      }
      
      // Remove from demo contracts array (simulating deletion)
      demoContracts.splice(contractIndex, 1);
      
      return NextResponse.json({ 
        message: '契約書が削除されました',
        success: true 
      });
    }
    
    const contractService = await getContractService();

    // Check if contract exists
    const existingContract = await contractService['contracts'].findOne({ 
      contractId: id 
    });

    if (!existingContract) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.CONTRACT_NOT_FOUND },
        { status: 404 }
      );
    }

    // Hard delete (permanent removal)
    const result = await contractService['contracts'].delete({ 
      contractId: id 
    });

    if (!result) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.GENERIC },
        { status: 500 }
      );
    }

    // Log deletion action
    await contractService['auditLogs'].create({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action: 'deleted',
      performedBy: 'system', // TODO: Get from auth
      performedAt: new Date(),
      details: { 
        contractId: id,
        title: existingContract.title
      },
    });

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