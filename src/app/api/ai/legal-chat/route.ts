import { NextRequest, NextResponse } from 'next/server';
import { getContractService } from '@/lib/db/mongodb';
import { contractRAGService, LegalChatResponse } from '@/lib/legal/rag-service';
import { checkRateLimit, validateRequestBody, createErrorResponse } from '@/app/api/utils/validation';
import { fetchContract, isDemoMode } from '@/app/api/utils/contract-fetcher';

// POST /api/ai/legal-chat - 法務特化型AIチャット
interface ChatRequestBody {
  contractId: string;
  message: string;
  conversationHistory?: any[];
  isContractSpecific?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - チャット機能は頻繁に使用されるため少し緩く設定
    const rateLimitResponse = await checkRateLimit(request, 'legal_chat', 30, 60);
    if (rateLimitResponse) return rateLimitResponse;

    // Request validation
    const body = await request.json() as ChatRequestBody;
    const validation = validateRequestBody<ChatRequestBody>(body, ['contractId', 'message']);
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Message validation
    if (typeof body.message !== 'string' || body.message.trim().length === 0) {
      return NextResponse.json(
        { error: '有効なメッセージを入力してください' },
        { status: 400 }
      );
    }

    // 契約書を取得
    const { contract, error } = await fetchContract(body.contractId);
    
    if (error || !contract) {
      return NextResponse.json(
        { error: error || '契約書が見つかりません' },
        { status: 404 }
      );
    }

    console.log(`Processing legal chat for contract: ${body.contractId}`);
    console.log(`User message: ${body.message.substring(0, 100)}...`);

    // 法務特化型チャット処理
    const chatResponse = await contractRAGService.legalChat(
      body.contractId,
      body.message.trim(),
      contract,
      body.isContractSpecific || false
    );

    // 会話履歴を保存（実際のDB環境の場合）
    if (!isDemoMode()) {
      await saveChatHistory(body, chatResponse);
    }

    return NextResponse.json({
      success: true,
      ...chatResponse,
      metadata: {
        contractId: body.contractId,
        messageProcessedAt: new Date().toISOString(),
        legalReferencesCount: chatResponse.references.length,
        responseLength: chatResponse.response.length
      }
    });

  } catch (error) {
    // ユーザーフレンドリーなエラーレスポンス
    const errorResponse = createErrorResponse(
      error, 
      '法務チャットの処理中にエラーが発生しました'
    );
    
    // エラーレスポンスにチャット固有の情報を追加
    const errorBody = await errorResponse.json();
    return NextResponse.json(
      { 
        success: false,
        ...errorBody,
        response: '申し訳ございませんが、現在システムに問題が発生しています。重要な法的事項については、専門家にご相談いただくようお願いいたします。',
        references: [],
        confidence: 0,
        metadata: {
          errorOccurredAt: new Date().toISOString()
        }
      },
      { status: errorResponse.status }
    );
  }
}

/**
 * Save chat history to audit logs
 */
async function saveChatHistory(
  requestBody: ChatRequestBody,
  chatResponse: LegalChatResponse
): Promise<void> {
  try {
    const contractService = await getContractService();
    
    await contractService['auditLogs'].create({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action: 'legal_chat',
      performedBy: 'user', // 実際には認証システムから取得
      performedAt: new Date(),
      details: { 
        contractId: requestBody.contractId,
        messageLength: requestBody.message.length,
        responseLength: chatResponse.response.length,
        confidence: chatResponse.confidence,
        referencesCount: chatResponse.references.length,
        isContractSpecific: requestBody.isContractSpecific || false
      },
    });
  } catch (error) {
    console.error('Failed to log chat history:', error);
    // ログ記録の失敗はチャット機能に影響させない
  }
}