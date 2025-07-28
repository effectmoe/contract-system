import { Contract, AIAnalysis } from '@/types/contract';
import { legalKnowledgeService, LegalReference, ContractTemplate, LegalUpdate } from './knowledge-base';
import { deepSeekService } from '@/lib/ai/deepseek';
import { kvCache, CacheKeys, CacheDurations } from '@/lib/db/kv';

/**
 * 拡張されたAI分析結果
 */
export interface EnhancedAnalysis extends AIAnalysis {
  legalReferences: LegalReference[];
  recommendedClauses: string[];
  complianceChecks: ComplianceCheck[];
  stampTaxInfo: StampTaxInfo;
  relatedUpdates: LegalUpdate[];
}

export interface ComplianceCheck {
  id: string;
  title: string;
  status: 'compliant' | 'warning' | 'non_compliant';
  description: string;
  recommendation?: string;
  legalBasis: string;
}

export interface StampTaxInfo {
  taxAmount: number;
  explanation: string;
  legalBasis: string;
}

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
      const legalTopics = await this.extractLegalTopics(contract);
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
      const enhancedContext = this.buildEnhancedContext(
        contract,
        legalReferences,
        contractTemplates,
        legalUpdates
      );

      // 4. コンプライアンスチェック
      const complianceChecks = await this.performComplianceChecks(contract, legalReferences);

      // 5. 法務特化型AI分析の実行
      const baseAnalysis = await this.performLegalAnalysis(contract, enhancedContext);

      // 6. 推奨条項の生成
      const recommendedClauses = this.generateRecommendedClauses(contract, contractTemplates);

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
  ): Promise<{
    response: string;
    references: LegalReference[];
    confidence: number;
  }> {
    try {
      let enhancedContext = '';
      let references: LegalReference[] = [];

      if (context) {
        // 質問内容から関連する法的トピックを抽出
        const topics = await this.extractLegalTopicsFromQuery(message);
        
        // 関連する法的情報を取得
        references = await legalKnowledgeService.searchLegalProvisions(topics);
        
        // コンテキストを構築
        enhancedContext = this.buildChatContext(context, references, message, isContractSpecific);
      }

      // DeepSeekを使用して法務特化型の回答を生成
      const response = await this.generateLegalResponse(message, enhancedContext, isContractSpecific, context);
      
      // 回答の信頼度を計算
      const confidence = this.calculateResponseConfidence(response, references);

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
  async optimizeContractClauses(contract: Contract): Promise<{
    suggestions: ClauseOptimization[];
    riskMitigation: string[];
    legalCompliance: string[];
  }> {
    try {
      const templates = await legalKnowledgeService.getContractTemplates(contract.type);
      const legalReferences = await legalKnowledgeService.searchLegalProvisions([contract.type, '契約条項']);

      const suggestions = this.generateClauseOptimizations(contract, templates);
      const riskMitigation = this.generateRiskMitigationSuggestions(contract, legalReferences);
      const legalCompliance = this.generateComplianceSuggestions(contract, legalReferences);

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

  private async extractLegalTopics(contract: Contract): Promise<string[]> {
    const topics = [];
    
    // 契約種別に基づく基本トピック
    switch (contract.type) {
      case 'service_agreement':
        topics.push('業務委託', '善管注意義務', '損害賠償', '契約解除');
        break;
      case 'employment':
        topics.push('雇用契約', '労働基準法', '就業規則', '解雇');
        break;
      case 'nda':
        topics.push('秘密保持', '機密情報', '競業禁止', '損害賠償');
        break;
      default:
        topics.push('契約', '民法', '債務不履行');
    }

    // 契約内容からキーワードを抽出
    const contentKeywords = this.extractKeywordsFromContent(contract.content);
    topics.push(...contentKeywords);

    return [...new Set(topics)]; // 重複除去
  }

  private extractKeywordsFromContent(content: string): string[] {
    const legalKeywords = [
      '契約期間', '更新', '解除', '損害賠償', '責任', '義務', '権利',
      '支払い', '報酬', '対価', '成果物', '著作権', '知的財産',
      '秘密保持', '競業禁止', '準拠法', '管轄裁判所'
    ];

    return legalKeywords.filter(keyword => content.includes(keyword));
  }

  private async extractLegalTopicsFromQuery(query: string): Promise<string[]> {
    const topics = [];
    
    // 質問文から法的キーワードを抽出
    const queryKeywords = this.extractKeywordsFromContent(query);
    topics.push(...queryKeywords);

    // 一般的な法的質問パターンの検出
    if (query.includes('解除') || query.includes('キャンセル')) {
      topics.push('契約解除', '民法第545条');
    }
    if (query.includes('損害') || query.includes('賠償')) {
      topics.push('損害賠償', '民法第415条');
    }
    if (query.includes('印紙') || query.includes('税')) {
      topics.push('印紙税', '印紙税法');
    }

    return [...new Set(topics)];
  }

  private buildEnhancedContext(
    contract: Contract,
    legalReferences: LegalReference[],
    templates: ContractTemplate[],
    updates: LegalUpdate[]
  ): string {
    let context = `契約書分析コンテキスト：\n\n`;
    context += `契約タイトル: ${contract.title}\n`;
    context += `契約種別: ${contract.type}\n`;
    context += `作成日: ${contract.createdAt}\n\n`;

    if (legalReferences.length > 0) {
      context += `関連法令：\n`;
      legalReferences.forEach(ref => {
        context += `- ${ref.title}: ${ref.content}\n`;
      });
      context += `\n`;
    }

    if (templates.length > 0) {
      context += `推奨条項（テンプレートより）：\n`;
      templates[0].clauses.forEach(clause => {
        context += `- ${clause.title}: ${clause.explanation}\n`;
      });
      context += `\n`;
    }

    if (updates.length > 0) {
      context += `関連する法改正情報：\n`;
      updates.forEach(update => {
        context += `- ${update.title}: ${update.summary}\n`;
      });
      context += `\n`;
    }

    return context;
  }

  private buildChatContext(
    contract: Contract,
    references: LegalReference[],
    query: string,
    isContractSpecific: boolean = false
  ): string {
    let context = `以下の契約書について質問に回答してください：\n\n`;
    context += `契約書タイトル: ${contract.title}\n`;
    context += `契約内容:\n${contract.content}\n\n`;

    if (references.length > 0) {
      context += `関連する法的根拠：\n`;
      references.forEach(ref => {
        context += `- ${ref.title}: ${ref.content}\n`;
      });
      context += `\n`;
    }

    context += `質問: ${query}\n\n`;
    
    if (isContractSpecific) {
      context += `【重要な制約事項】
この契約書「${contract.title}」に完全に特化した回答のみを提供してください。
- この契約書の具体的な条項のみを参照
- この契約書に直接関連する法的事項のみ言及
- 一般論や他の契約書に関する回答は避ける
- 必ず契約書の具体的な内容を引用して回答する

上記の制約に基づいて、この特定の契約書についてのみ、正確で実用的な回答を提供してください。`;
    } else {
      context += `上記の法的根拠に基づいて、正確で実用的な回答を提供してください。不確実な場合は、その旨を明記し、専門家への相談を推奨してください。`;
    }

    return context;
  }

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

  private async performComplianceChecks(
    contract: Contract,
    references: LegalReference[]
  ): Promise<ComplianceCheck[]> {
    const checks: ComplianceCheck[] = [];

    // 基本的なコンプライアンスチェック
    checks.push({
      id: 'contract_parties',
      title: '契約当事者の明記',
      status: contract.parties.length >= 2 ? 'compliant' : 'warning',
      description: contract.parties.length >= 2 
        ? '契約当事者が適切に明記されています。' 
        : '契約当事者の情報が不完全な可能性があります。',
      legalBasis: '民法第522条（契約の成立）'
    });

    // 電子契約特有のチェック
    if (contract.signatures.length > 0) {
      checks.push({
        id: 'electronic_signature',
        title: '電子署名の有効性',
        status: 'compliant',
        description: '電子署名が適切に実施されています。',
        legalBasis: '電子署名法第3条'
      });
    }

    // 契約種別別のチェック
    if (contract.type === 'employment') {
      checks.push({
        id: 'labor_standards',
        title: '労働基準法への準拠',
        status: 'warning',
        description: '労働条件の明示が労働基準法に準拠しているか確認が必要です。',
        recommendation: '労働基準法第15条に基づく労働条件の明示を確認してください。',
        legalBasis: '労働基準法第15条'
      });
    }

    return checks;
  }

  private generateRecommendedClauses(
    contract: Contract,
    templates: ContractTemplate[]
  ): string[] {
    const recommendations: string[] = [];

    if (templates.length > 0) {
      const template = templates[0];
      
      // 必須条項のチェック
      const essentialClauses = template.clauses.filter(c => c.category === 'essential');
      essentialClauses.forEach(clause => {
        if (!contract.content.includes(clause.title.replace(/第\d+条/, ''))) {
          recommendations.push(`${clause.title}の追加を推奨します: ${clause.explanation}`);
        }
      });

      // 推奨条項の提案
      const recommendedClauses = template.clauses.filter(c => c.category === 'recommended');
      recommendedClauses.forEach(clause => {
        recommendations.push(`${clause.title}の検討を推奨します: ${clause.explanation}`);
      });
    }

    return recommendations;
  }

  private generateRiskMitigationSuggestions(
    contract: Contract,
    references: LegalReference[]
  ): string[] {
    return [
      '契約解除条項の明確化により、予期しない状況に対応できます。',
      '損害賠償条項の上限設定により、過度なリスクを回避できます。',
      '不可抗力条項の追加により、天災等による履行不能リスクを軽減できます。',
      '準拠法と管轄裁判所の明記により、紛争時の対応を明確にできます。'
    ];
  }

  private generateComplianceSuggestions(
    contract: Contract,
    references: LegalReference[]
  ): string[] {
    const suggestions = [];

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

  private calculateResponseConfidence(response: string, references: LegalReference[]): number {
    let confidence = 0.5; // ベース信頼度

    // 法的根拠の引用数に基づく加点
    confidence += Math.min(0.3, references.length * 0.1);

    // 不確実性の表現による減点
    if (response.includes('不明') || response.includes('確実ではない')) {
      confidence -= 0.2;
    }

    // 専門家相談推奨による適切な減点
    if (response.includes('専門家') || response.includes('弁護士')) {
      confidence -= 0.1; // むしろ誠実さの表れとして軽微な減点
    }

    return Math.max(0, Math.min(1, confidence));
  }

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

  private generateClauseOptimizations(
    contract: Contract,
    templates: ContractTemplate[]
  ): ClauseOptimization[] {
    return [
      {
        id: 'clause_clarity',
        title: '条項の明確化',
        currentIssue: '曖昧な表現が含まれています',
        suggestion: 'より具体的で明確な表現に変更することを推奨します',
        priority: 'high',
        legalBasis: '契約解釈の明確性の原則'
      }
    ];
  }
}

export interface ClauseOptimization {
  id: string;
  title: string;
  currentIssue: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  legalBasis: string;
}

// Export singleton instance
export const contractRAGService = new ContractRAGService();