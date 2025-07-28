import { NextRequest, NextResponse } from 'next/server';
import { getContractService } from '@/lib/db/mongodb';
import { contractRAGService } from '@/lib/legal/rag-service';
import { rateLimiter } from '@/lib/db/kv';
import { ERROR_MESSAGES } from '@/lib/utils/constants';
import { config } from '@/lib/config/env';
import { demoContracts } from '@/lib/db/demo-data';

// POST /api/ai/legal-chat - 法務特化型AIチャット
export async function POST(request: NextRequest) {
  try {
    // Rate limiting - チャット機能は頻繁に使用されるため少し緩く設定
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed } = await rateLimiter.checkLimit(`legal_chat:${ip}`, 30, 60);
    
    if (!allowed) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.RATE_LIMIT },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { contractId, message, conversationHistory, isContractSpecific = false } = body;

    if (!contractId || !message) {
      return NextResponse.json(
        { error: '契約IDとメッセージが必要です' },
        { status: 400 }
      );
    }

    if (typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: '有効なメッセージを入力してください' },
        { status: 400 }
      );
    }

    // 契約書を取得
    let contract;
    
    // Demo mode
    const isActuallyDemo = !process.env.MONGODB_URI || process.env.MONGODB_URI === 'demo-mode' || process.env.MONGODB_URI.includes('your-cluster');
    
    if (config.isDemo || isActuallyDemo) {
      contract = demoContracts.find(c => c.contractId === contractId);
      
      if (!contract) {
        return NextResponse.json(
          { error: ERROR_MESSAGES.CONTRACT_NOT_FOUND },
          { status: 404 }
        );
      }
    } else {
      const contractService = await getContractService();
      contract = await contractService['contracts'].findOne({ 
        contractId 
      });

      if (!contract) {
        return NextResponse.json(
          { error: ERROR_MESSAGES.CONTRACT_NOT_FOUND },
          { status: 404 }
        );
      }
    }

    console.log(`Processing legal chat for contract: ${contractId}`);
    console.log(`User message: ${message.substring(0, 100)}...`);

    // 法務特化型チャット処理
    const chatResponse = await contractRAGService.legalChat(
      contractId,
      message.trim(),
      contract,
      isContractSpecific
    );

    // 会話履歴を保存（実際のDB環境の場合）
    if (!config.isDemo && !isActuallyDemo) {
      const contractService = await getContractService();
      
      try {
        // チャット履歴を監査ログとして記録
        await contractService['auditLogs'].create({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          action: 'legal_chat',
          performedBy: 'user', // 実際には認証システムから取得
          performedAt: new Date(),
          details: { 
            contractId,
            messageLength: message.length,
            responseLength: chatResponse.response.length,
            confidence: chatResponse.confidence,
            referencesCount: chatResponse.references.length,
            isContractSpecific
          },
        });
      } catch (logError) {
        console.error('Failed to log chat history:', logError);
        // ログ記録の失敗はチャット機能に影響させない
      }
    }

    return NextResponse.json({
      success: true,
      response: chatResponse.response,
      references: chatResponse.references,
      confidence: chatResponse.confidence,
      metadata: {
        contractId,
        messageProcessedAt: new Date().toISOString(),
        legalReferencesCount: chatResponse.references.length,
        responseLength: chatResponse.response.length
      }
    });

  } catch (error) {
    console.error('Legal chat error:', error);
    
    // より詳細なエラー情報をログに記録
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    // ユーザーフレンドリーなエラーレスポンス
    return NextResponse.json(
      { 
        success: false,
        error: '法務チャットの処理中にエラーが発生しました',
        response: '申し訳ございませんが、現在システムに問題が発生しています。重要な法的事項については、専門家にご相談いただくようお願いいたします。',
        references: [],
        confidence: 0,
        metadata: {
          errorOccurredAt: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}