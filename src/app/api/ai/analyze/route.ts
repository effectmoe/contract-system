import { NextRequest, NextResponse } from 'next/server';
import { getContractService } from '@/lib/db/mongodb';
import { deepSeekService } from '@/lib/ai/deepseek';
import { rateLimiter } from '@/lib/db/kv';
import { ERROR_MESSAGES } from '@/lib/utils/constants';

// POST /api/ai/analyze - Analyze contract with AI
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed } = await rateLimiter.checkLimit(`ai:${ip}`, 20, 60);
    
    if (!allowed) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.RATE_LIMIT },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { contractId } = body;

    if (!contractId) {
      return NextResponse.json(
        { error: '契約IDが必要です' },
        { status: 400 }
      );
    }

    const contractService = await getContractService();
    const contract = await contractService['contracts'].findOne({ 
      contractId 
    });

    if (!contract) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.CONTRACT_NOT_FOUND },
        { status: 404 }
      );
    }

    // Perform AI analysis
    const analysis = await deepSeekService.analyzeContract(contract);

    // Update contract with AI analysis
    await contractService['contracts'].update(
      { contractId },
      { 
        $set: { 
          aiAnalysis: analysis,
          aiTags: analysis.keyTerms,
          updatedAt: new Date()
        } 
      }
    );

    // Log action
    await contractService['auditLogs'].create({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action: 'ai_analyzed',
      performedBy: 'system',
      performedAt: new Date(),
      details: { 
        contractId,
        analysisType: 'full',
        risksFound: analysis.risks.length
      },
    });

    return NextResponse.json({
      message: 'AI分析が完了しました',
      analysis,
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.AI_SERVICE_ERROR },
      { status: 500 }
    );
  }
}