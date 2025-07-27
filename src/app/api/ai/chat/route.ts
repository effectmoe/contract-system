import { NextRequest, NextResponse } from 'next/server';
import { getContractService } from '@/lib/db/mongodb';
import { deepSeekService } from '@/lib/ai/deepseek';
import { rateLimiter } from '@/lib/db/kv';
import { ERROR_MESSAGES } from '@/lib/utils/constants';

// POST /api/ai/chat - Chat with AI about contract
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed } = await rateLimiter.checkLimit(`ai:${ip}`, 30, 60);
    
    if (!allowed) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.RATE_LIMIT },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { message, contractId } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'メッセージが必要です' },
        { status: 400 }
      );
    }

    let context: string | undefined;

    // If contractId is provided, load contract as context
    if (contractId) {
      const contractService = await getContractService();
      const contract = await contractService['contracts'].findOne({ 
        contractId 
      });

      if (contract) {
        context = `契約書タイトル: ${contract.title}\n契約種類: ${contract.type}\n\n契約内容:\n${contract.content}`;
      }
    }

    // Get AI response
    const response = await deepSeekService.chat(contractId || 'general', message, context);

    return NextResponse.json({
      message: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.AI_SERVICE_ERROR },
      { status: 500 }
    );
  }
}