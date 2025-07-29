import { NextRequest, NextResponse } from 'next/server';
import { getContractService } from '@/lib/db/mongodb';
import { contractRAGService } from '@/lib/legal/rag-service';
import { checkRateLimit, validateRequestBody, createErrorResponse } from '@/app/api/utils/validation';
import { fetchContract, isDemoMode } from '@/app/api/utils/contract-fetcher';

// POST /api/ai/enhanced-analyze - 法務知識ベース連携の拡張AI分析
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await checkRateLimit(request, 'ai_enhanced', 10, 60);
    if (rateLimitResponse) return rateLimitResponse;

    // Request validation
    const body = await request.json();
    const validation = validateRequestBody<{ contractId: string }>(body, ['contractId']);
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
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

    // 拡張AI分析を実行
    console.log(`Starting enhanced AI analysis for contract: ${body.contractId}`);
    const enhancedAnalysis = await contractRAGService.enhancedContractAnalysis(contract);

    // 実際のデータベース環境の場合は結果を保存
    if (!isDemoMode()) {
      await saveAnalysisResults(body.contractId, enhancedAnalysis);
    }

    return NextResponse.json({
      message: '法務知識ベース連携の拡張AI分析が完了しました',
      analysis: enhancedAnalysis,
      metadata: {
        legalReferencesCount: enhancedAnalysis.legalReferences.length,
        complianceChecksCount: enhancedAnalysis.complianceChecks.length,
        recommendedClausesCount: enhancedAnalysis.recommendedClauses.length,
        relatedUpdatesCount: enhancedAnalysis.relatedUpdates.length,
        analyzedAt: enhancedAnalysis.analyzedAt
      }
    });

  } catch (error) {
    return createErrorResponse(error, '拡張AI分析の処理中にエラーが発生しました');
  }
}

/**
 * Save analysis results to database
 */
async function saveAnalysisResults(contractId: string, enhancedAnalysis: any): Promise<void> {
  try {
    const contractService = await getContractService();
    
    // 契約書に拡張分析結果を保存
    await contractService['contracts'].update(
      { contractId },
      { 
        $set: { 
          enhancedAiAnalysis: enhancedAnalysis,
          aiTags: enhancedAnalysis.keyTerms,
          legalReferences: enhancedAnalysis.legalReferences.map((ref: any) => ref.id),
          updatedAt: new Date()
        } 
      }
    );

    // 監査ログを記録
    await contractService['auditLogs'].create({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action: 'enhanced_ai_analyzed',
      performedBy: 'system',
      performedAt: new Date(),
      details: { 
        contractId,
        analysisType: 'enhanced_rag',
        legalReferencesCount: enhancedAnalysis.legalReferences.length,
        complianceChecksCount: enhancedAnalysis.complianceChecks.length,
        stampTaxAmount: enhancedAnalysis.stampTaxInfo.taxAmount
      },
    });
  } catch (error) {
    console.error('Failed to save analysis results:', error);
    // 保存の失敗は分析結果の返却に影響させない
  }
}