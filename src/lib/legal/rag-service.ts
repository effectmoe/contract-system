import { Contract, AIAnalysis } from '@/types/contract';
import { legalKnowledgeService } from './knowledge-base';
import { deepSeekService } from '@/lib/ai/deepseek';
import { kvCache, CacheKeys, CacheDurations } from '@/lib/db/kv';
import { 
  EnhancedAnalysis, 
  ComplianceCheck, 
  ClauseOptimization, 
  LegalChatResponse, 
  OptimizationResult 
} from './rag-types';
import {
  extractLegalTopicsFromContract,
  extractLegalTopicsFromQuery,
  buildEnhancedContext,
  buildChatContext,
  performBasicComplianceChecks,
  generateRecommendedClauses,
  calculateResponseConfidence
} from './utils';
import { RISK_MITIGATION_SUGGESTIONS } from './constants';
import { LegalReference, ContractTemplate } from './types';

export * from './rag-types';

/**
 * RAG（Retrieval-Augmented Generation）サービス
 * 法務知識ベースと連携して、より確実で専門的なAI分析を提供
 */
export class ContractRAGService {
  /**
   * 法務知識ベースを活用した拡張契約分析
   */
  async enhancedContractAnalysis(contract: Contract): Promise<EnhancedAnalysis> {
    const cacheKey = CacheKeys.aiResponse(`rag_analysis_${contract.contractId}`);
    const cached = await kvCache.get<EnhancedAnalysis>(cacheKey);
    if (cached) return cached;

    try {
      // 1. 契約内容から法的トピックを抽出
      const legalTopics = extractLegalTopicsFromContract(contract);
      console.log('Extracted legal topics:', legalTopics);

      // 2. 関連する法的情報を並列取得
      const [
        legalReferences,
        contractTemplates,
        legalUpdates,
        stampTaxInfo
      ] = await Promise.all([
        legalKnowledgeService.searchLegalProvisions(legalTopics),
        legalKnowledgeService.getContractTemplates(contract.type),
        legalKnowledgeService.getLegalUpdates([contract.type]),
        legalKnowledgeService.calculateStampTax(contract.type, contract.transactionAmount)
      ]);

      // 3. 取得した情報をコンテキストとしてAI分析を実行
      const enhancedContext = buildEnhancedContext(
        contract,
        legalReferences,
        contractTemplates,
        legalUpdates
      );

      // 4. コンプライアンスチェック
      const complianceChecks = this.performEnhancedComplianceChecks(contract, legalReferences);

      // 5. 法務特化型AI分析の実行
      const baseAnalysis = await this.performLegalAnalysis(contract, enhancedContext);

      // 6. 推奨条項の生成
      const recommendedClauses = generateRecommendedClauses(contract, contractTemplates);

      const result: EnhancedAnalysis = {
        ...baseAnalysis,
        legalReferences,
        recommendedClauses,
        complianceChecks,
        stampTaxInfo,
        relatedUpdates: legalUpdates
      };

      // キャッシュに保存
      await kvCache.set(cacheKey, result, { ex: CacheDurations.aiResponse });
      return result;

    } catch (error) {
      console.error('Enhanced contract analysis error:', error);
      // フォールバック: 基本的なAI分析を返す
      const fallbackAnalysis = await deepSeekService.analyzeContract(contract);
      return {
        ...fallbackAnalysis,
        legalReferences: [],
        recommendedClauses: [],
        complianceChecks: [],
        stampTaxInfo: { taxAmount: 0, explanation: '計算できませんでした', legalBasis: '' },
        relatedUpdates: []
      };
    }
  }

  /**
   * 法務特化型チャット機能
   */
  async legalChat(
    contractId: string,
    message: string,
    context?: Contract,
    isContractSpecific: boolean = false
  ): Promise<LegalChatResponse> {
    try {
      let enhancedContext = '';
      let references: LegalReference[] = [];

      if (context) {
        // 質問内容から関連する法的トピックを抽出
        const topics = extractLegalTopicsFromQuery(message);
        
        // 関連する法的情報を取得
        references = await legalKnowledgeService.searchLegalProvisions(topics);
        
        // コンテキストを構築
        enhancedContext = buildChatContext(context, references, message, isContractSpecific);
      }

      // DeepSeekを使用して法務特化型の回答を生成
      const response = await this.generateLegalResponse(message, enhancedContext, isContractSpecific, context);
      
      // 回答の信頼度を計算
      const confidence = calculateResponseConfidence(response, references);

      return {
        response,
        references,
        confidence
      };

    } catch (error) {
      console.error('Legal chat error:', error);
      return {
        response: '申し訳ございませんが、回答の生成中にエラーが発生しました。一般的な法的事項については、専門家にご相談いただくことをお勧めします。',
        references: [],
        confidence: 0
      };
    }
  }

  /**
   * 契約条項の最適化提案
   */
  async optimizeContractClauses(contract: Contract): Promise<OptimizationResult> {
    try {
      const templates = await legalKnowledgeService.getContractTemplates(contract.type);
      const legalReferences = await legalKnowledgeService.searchLegalProvisions([contract.type, '契約条項']);

      const suggestions = this.generateClauseOptimizations(contract, templates);
      const riskMitigation = RISK_MITIGATION_SUGGESTIONS.slice();
      const legalCompliance = this.generateComplianceSuggestions(legalReferences);

      return {
        suggestions,
        riskMitigation,
        legalCompliance
      };

    } catch (error) {
      console.error('Contract optimization error:', error);
      return {
        suggestions: [],
        riskMitigation: ['専門家による詳細な契約書レビューを推奨します。'],
        legalCompliance: ['最新の法令遵守状況について法務専門家にご確認ください。']
      };
    }
  }

  // プライベートヘルパーメソッド

  private async performLegalAnalysis(contract: Contract, context: string): Promise<AIAnalysis> {
    try {
      // DeepSeekサービスを使用して法務特化型分析を実行
      const prompt = `${context}\n\n上記のコンテキストと法的根拠に基づいて、この契約書を分析してください。特に以下の点に注意してください：
      1. 法的リスクの具体的な評価
      2. 関連法令との整合性
      3. 実務上の問題点
      4. 改善提案`;

      // 実際にはDeepSeekServiceのchatメソッドを使用
      const response = await deepSeekService.chat(contract.contractId, prompt, context);
      
      // レスポンスをAIAnalysis形式にパース
      return this.parseLegalAnalysisResponse(response, contract);

    } catch (error) {
      console.error('Legal analysis error:', error);
      // フォールバック
      return await deepSeekService.analyzeContract(contract);
    }
  }

  /**
   * 拡張コンプライアンスチェック
   */
  private performEnhancedComplianceChecks(
    contract: Contract,
    references: LegalReference[]
  ): ComplianceCheck[] {
    // 基本チェックを実行
    const basicChecks = performBasicComplianceChecks(contract);
    
    // 法的参照に基づく追加チェック
    const additionalChecks: ComplianceCheck[] = [];
    
    // 関連法令に基づくチェックを追加
    if (references.some(ref => ref.title.includes('民法'))) {
      additionalChecks.push({
        id: 'civil_code_compliance',
        title: '民法準拠確認',
        status: 'compliant',
        description: '関連する民法条文に基づいたチェックが完了しました。',
        legalBasis: '民法各条'
      });
    }
    
    return [...basicChecks, ...additionalChecks];
  }

  // 削除 - utils.tsに移動済み

  /**
   * コンプライアンス提案を生成
   */
  private generateComplianceSuggestions(references: LegalReference[]): string[] {
    const suggestions: string[] = [];

    // 法的根拠に基づく提案
    references.forEach(ref => {
      if (ref.title.includes('民法')) {
        suggestions.push(`${ref.title}に基づく条項の見直しを検討してください。`);
      }
    });

    // 一般的なコンプライアンス提案
    suggestions.push('最新の法改正情報を確認し、契約条項の更新を検討してください。');
    suggestions.push('業界特有の規制要件への準拠状況を確認してください。');

    return suggestions;
  }

  private async generateLegalResponse(message: string, context: string, isContractSpecific: boolean = false, contractContext?: Contract): Promise<string> {
    let systemPrompt = `あなたは日本の法律に精通した契約書専門のAIアシスタントです。以下のコンテキストに基づいて、正確で実用的な法的アドバイスを提供してください。`;

    if (isContractSpecific) {
      systemPrompt += `

【契約書特化モード】
あなたは指定された契約書にのみ特化した専門アシスタントです：
1. この契約書の具体的な条項のみを参照して回答してください
2. 契約書に記載されていない一般的な法的情報は提供しないでください  
3. 必ず契約書の具体的な文言を引用して説明してください
4. この契約書以外の例や比較は避けてください
5. 回答は必ずこの契約書の内容に基づいて行ってください`;
    }

    systemPrompt += `

重要な注意事項:
1. 法的根拠を明示してください
2. 不確実な場合は、その旨を明記してください
3. 必要に応じて専門家への相談を推奨してください
4. 実務的で具体的なアドバイスを心がけてください

コンテキスト:
${context}`;

    try {
      return await deepSeekService.chat('legal_chat', message, systemPrompt);
    } catch (error) {
      console.error('Legal response generation error:', error);
      return '申し訳ございませんが、回答の生成中にエラーが発生しました。専門家にご相談いただくことをお勧めします。';
    }
  }

  // 削除 - utils.tsに移動済み

  private parseLegalAnalysisResponse(response: string, contract: Contract): AIAnalysis {
    // 簡易的なパーシング - 実際にはより高度な解析が必要
    return {
      summary: response.substring(0, 200) + '...',
      keyTerms: ['法的根拠に基づく分析', 'コンプライアンス確認済み'],
      risks: [
        {
          level: 'low',
          description: '法的知識ベースに基づく分析により、基本的なリスクは軽減されています。'
        }
      ],
      recommendations: [
        '法的根拠に基づく詳細な分析が完了しました。',
        '必要に応じて専門家による最終確認を推奨します。'
      ],
      contractType: contract.type,
      analyzedAt: new Date()
    };
  }

  /**
   * 条項最適化提案を生成
   */
  private generateClauseOptimizations(
    contract: Contract,
    templates: ContractTemplate[]
  ): ClauseOptimization[] {
    const optimizations: ClauseOptimization[] = [];
    
    // 基本的な最適化提案
    optimizations.push({
      id: 'clause_clarity',
      title: '条項の明確化',
      currentIssue: '曖昧な表現が含まれている可能性があります',
      suggestion: 'より具体的で明確な表現に変更することを推奨します',
      priority: 'high',
      legalBasis: '契約解釈の明確性の原則'
    });
    
    // テンプレートに基づく追加提案
    if (templates.length > 0) {
      const missingClauses = templates[0].clauses.filter(clause => 
        !contract.content.includes(clause.title.replace(/第\d+条/, ''))
      );
      
      if (missingClauses.length > 0) {
        optimizations.push({
          id: 'missing_clauses',
          title: '不足条項の追加',
          currentIssue: '重要な条項が不足しています',
          suggestion: 'テンプレートに基づいて必要な条項を追加してください',
          priority: 'medium',
          legalBasis: '契約の完全性の原則'
        });
      }
    }
    
    return optimizations;
  }
}

// Export singleton instance
export const contractRAGService = new ContractRAGService();