import { NextRequest, NextResponse } from 'next/server';
import { getContractService } from '@/lib/db/mongodb';
import { contractRAGService } from '@/lib/legal/rag-service';
import { rateLimiter } from '@/lib/db/kv';
import { ERROR_MESSAGES } from '@/lib/utils/constants';
import { config } from '@/lib/config/env';
import { demoContracts } from '@/lib/db/demo-data';

// POST /api/ai/enhanced-analyze - 法務知識ベース連携の拡張AI分析
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed } = await rateLimiter.checkLimit(`ai_enhanced:${ip}`, 10, 60);
    
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

    // 拡張AI分析を実行
    console.log(`Starting enhanced AI analysis for contract: ${contractId}`);
    const enhancedAnalysis = await contractRAGService.enhancedContractAnalysis(contract);

    // 実際のデータベース環境の場合は結果を保存
    if (!config.isDemo && !isActuallyDemo) {
      const contractService = await getContractService();
      
      // 契約書に拡張分析結果を保存
      await contractService['contracts'].update(
        { contractId },
        { 
          $set: { 
            enhancedAiAnalysis: enhancedAnalysis,
            aiTags: enhancedAnalysis.keyTerms,
            legalReferences: enhancedAnalysis.legalReferences.map(ref => ref.id),
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
    console.error('Enhanced AI analysis error:', error);
    
    // より詳細なエラー情報をログに記録
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { 
        error: '拡張AI分析の処理中にエラーが発生しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}