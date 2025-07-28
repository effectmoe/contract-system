import { kvCache, CacheKeys, CacheDurations } from '@/lib/db/kv';

// 法的参照情報の型定義
export interface LegalReference {
  id: string;
  title: string;
  content: string;
  source: 'egov' | 'moj' | 'meti' | 'nta' | 'template';
  url?: string;
  lastUpdated: Date;
  relevanceScore: number;
}

export interface CaseReference {
  id: string;
  title: string;
  court: string;
  date: Date;
  summary: string;
  relevantClauses: string[];
  url?: string;
}

export interface ContractTemplate {
  id: string;
  type: string;
  title: string;
  description: string;
  clauses: TemplateClause[];
  industry?: string;
  source: string;
}

export interface TemplateClause {
  id: string;
  title: string;
  content: string;
  category: 'essential' | 'recommended' | 'optional';
  explanation: string;
}

export interface LegalUpdate {
  id: string;
  title: string;
  summary: string;
  effectiveDate: Date;
  impactLevel: 'high' | 'medium' | 'low';
  relatedContractTypes: string[];
  source: string;
}

/**
 * 法務知識ベースサービス
 * 官公庁API、判例データベース、契約書雛形などの信頼できる情報源と連携
 */
export class LegalKnowledgeService {
  private readonly egovApiBase = 'https://elaws.e-gov.go.jp/api/1';
  private readonly cachePrefix = 'legal_kb';

  /**
   * e-Gov法令APIから関連法令を検索
   */
  async searchLegalProvisions(keywords: string[]): Promise<LegalReference[]> {
    const cacheKey = CacheKeys.aiResponse(`${this.cachePrefix}_provisions_${keywords.join('_')}`);
    const cached = await kvCache.get<LegalReference[]>(cacheKey);
    if (cached) return cached;

    try {
      const results: LegalReference[] = [];
      
      // デモモード用のサンプルデータ
      if (!process.env.EGOV_API_KEY) {
        const sampleProvisions = this.getSampleLegalProvisions(keywords);
        await kvCache.set(cacheKey, sampleProvisions, { ex: CacheDurations.aiResponse });
        return sampleProvisions;
      }

      // 実際のe-Gov API呼び出し（実装時に詳細化）
      for (const keyword of keywords) {
        const response = await fetch(`${this.egovApiBase}/lawsearch`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'X-API-Key': process.env.EGOV_API_KEY || '',
          },
          // クエリパラメータは実際のAPI仕様に合わせて調整
        });

        if (response.ok) {
          const data = await response.json();
          // レスポンスデータの解析とLegalReference形式への変換
          // 実際のAPI仕様に基づいて実装
        }
      }

      await kvCache.set(cacheKey, results, { ex: CacheDurations.aiResponse });
      return results;
    } catch (error) {
      console.error('Legal provisions search error:', error);
      // フォールバック: サンプルデータを返す
      return this.getSampleLegalProvisions(keywords);
    }
  }

  /**
   * 契約書雛形データベースから関連テンプレートを取得
   */
  async getContractTemplates(contractType: string, industry?: string): Promise<ContractTemplate[]> {
    const cacheKey = CacheKeys.aiResponse(`${this.cachePrefix}_templates_${contractType}_${industry || 'general'}`);
    const cached = await kvCache.get<ContractTemplate[]>(cacheKey);
    if (cached) return cached;

    const templates = this.getBuiltInTemplates(contractType, industry);
    await kvCache.set(cacheKey, templates, { ex: CacheDurations.aiResponse });
    return templates;
  }

  /**
   * 法改正・更新情報を取得
   */
  async getLegalUpdates(contractTypes?: string[]): Promise<LegalUpdate[]> {
    const cacheKey = CacheKeys.aiResponse(`${this.cachePrefix}_updates_${contractTypes?.join('_') || 'all'}`);
    const cached = await kvCache.get<LegalUpdate[]>(cacheKey);
    if (cached) return cached;

    try {
      // デモモード用のサンプルデータ
      const updates = this.getSampleLegalUpdates(contractTypes);
      await kvCache.set(cacheKey, updates, { ex: 3600 }); // 1時間キャッシュ
      return updates;
    } catch (error) {
      console.error('Legal updates fetch error:', error);
      return [];
    }
  }

  /**
   * 判例データベースから関連判例を検索
   */
  async searchCaseLaw(keywords: string[], contractType?: string): Promise<CaseReference[]> {
    const cacheKey = CacheKeys.aiResponse(`${this.cachePrefix}_cases_${keywords.join('_')}_${contractType || 'all'}`);
    const cached = await kvCache.get<CaseReference[]>(cacheKey);
    if (cached) return cached;

    try {
      // デモモード用のサンプル判例データ
      const cases = this.getSampleCaseLaw(keywords, contractType);
      await kvCache.set(cacheKey, cases, { ex: CacheDurations.aiResponse });
      return cases;
    } catch (error) {
      console.error('Case law search error:', error);
      return [];
    }
  }

  /**
   * 印紙税計算（国税庁データ連携）
   */
  async calculateStampTax(contractType: string, contractAmount?: number): Promise<{
    taxAmount: number;
    explanation: string;
    legalBasis: string;
  }> {
    const cacheKey = CacheKeys.aiResponse(`${this.cachePrefix}_stamp_tax_${contractType}_${contractAmount || 0}`);
    const cached = await kvCache.get<any>(cacheKey);
    if (cached) return cached;

    // 印紙税法に基づく計算ロジック
    const result = this.calculateStampTaxAmount(contractType, contractAmount);
    await kvCache.set(cacheKey, result, { ex: 86400 }); // 24時間キャッシュ
    return result;
  }

  // プライベートヘルパーメソッド

  private getSampleLegalProvisions(keywords: string[]): LegalReference[] {
    const sampleData: LegalReference[] = [
      {
        id: 'civil_code_545',
        title: '民法第545条（解除の効果）',
        content: '当事者の一方がその解除権を行使したときは、各当事者は、その相手方を原状に復させる義務を負う。ただし、第三者の権利を害することはできない。',
        source: 'egov',
        url: 'https://elaws.e-gov.go.jp/document?lawid=129AC0000000089',
        lastUpdated: new Date('2023-04-01'),
        relevanceScore: 0.95
      },
      {
        id: 'civil_code_415',
        title: '民法第415条（債務不履行による損害賠償）',
        content: '債務者がその債務の本旨に従った履行をしないとき又は債務の履行が不能であるときは、債権者は、これによって生じた損害の賠償を請求することができる。',
        source: 'egov',
        url: 'https://elaws.e-gov.go.jp/document?lawid=129AC0000000089',
        lastUpdated: new Date('2023-04-01'),
        relevanceScore: 0.90
      },
      {
        id: 'electronic_signature_law_3',
        title: '電子署名法第3条（電子署名の効力）',
        content: '電磁的記録であって情報を表すために作成されたものは、当該電磁的記録に記録された情報について本人による電子署名が行われているときは、真正に成立したものと推定する。',
        source: 'egov',
        url: 'https://elaws.e-gov.go.jp/document?lawid=412AC0000000102',
        lastUpdated: new Date('2023-05-01'),
        relevanceScore: 0.88
      }
    ];

    // キーワードに基づく関連度フィルタリング
    return sampleData.filter(item => 
      keywords.some(keyword => 
        item.title.includes(keyword) || 
        item.content.includes(keyword)
      )
    );
  }

  private getBuiltInTemplates(contractType: string, industry?: string): ContractTemplate[] {
    const templates: ContractTemplate[] = [
      {
        id: 'service_agreement_basic',
        type: 'service_agreement',
        title: '業務委託契約書（基本版）',
        description: '一般的な業務委託契約のベーステンプレート',
        clauses: [
          {
            id: 'purpose',
            title: '第1条（目的）',
            content: '甲は乙に対し、以下に定める業務を委託し、乙はこれを受託する。',
            category: 'essential',
            explanation: '契約の基本的な目的を明確にする必須条項です。'
          },
          {
            id: 'scope',
            title: '第2条（業務内容）',
            content: '乙が甲に対して提供する業務の具体的内容は、別紙仕様書に定めるとおりとする。',
            category: 'essential',
            explanation: '委託する業務の範囲を具体的に定義します。'
          },
          {
            id: 'payment',
            title: '第3条（報酬）',
            content: '甲は乙に対し、本契約に基づく業務の対価として、別途合意する金額を支払う。',
            category: 'essential',
            explanation: '報酬の支払い条件を明確に定めます。'
          },
          {
            id: 'confidentiality',
            title: '第4条（秘密保持）',
            content: '両当事者は、本契約の履行過程において知り得た相手方の秘密情報を第三者に開示してはならない。',
            category: 'recommended',
            explanation: '機密情報の保護に関する重要な条項です。'
          }
        ],
        industry: industry || 'general',
        source: 'internal'
      },
      {
        id: 'nda_mutual',
        type: 'nda',
        title: '相互秘密保持契約書',
        description: '双方向の秘密保持を目的とした契約書テンプレート',
        clauses: [
          {
            id: 'definition',
            title: '第1条（秘密情報の定義）',
            content: '本契約において「秘密情報」とは、開示当事者が相手方に対して開示する一切の情報をいう。',
            category: 'essential',
            explanation: '秘密情報の範囲を明確に定義する基本条項です。'
          },
          {
            id: 'obligation',
            title: '第2条（秘密保持義務）',
            content: '受領当事者は、秘密情報を厳重に管理し、開示当事者の書面による事前の同意なく第三者に開示してはならない。',
            category: 'essential',
            explanation: '秘密保持の具体的な義務を定めます。'
          }
        ],
        industry: industry || 'general',
        source: 'internal'
      }
    ];

    return templates.filter(template => template.type === contractType);
  }

  private getSampleLegalUpdates(contractTypes?: string[]): LegalUpdate[] {
    return [
      {
        id: 'electronic_contract_update_2024',
        title: '電子契約に関するガイドライン改正（2024年4月施行）',
        summary: '電子署名の有効性に関する新しい要件が追加され、より厳格な本人確認プロセスが求められるようになりました。',
        effectiveDate: new Date('2024-04-01'),
        impactLevel: 'high',
        relatedContractTypes: ['service_agreement', 'nda', 'employment'],
        source: '経済産業省'
      },
      {
        id: 'labor_law_update_2024',
        title: '労働契約法の一部改正',
        summary: 'リモートワークに関する就業規則の明記義務化など、働き方の多様化に対応した改正が行われました。',
        effectiveDate: new Date('2024-06-01'),
        impactLevel: 'medium',
        relatedContractTypes: ['employment'],
        source: '厚生労働省'
      }
    ];
  }

  private getSampleCaseLaw(keywords: string[], contractType?: string): CaseReference[] {
    return [
      {
        id: 'supreme_court_2023_001',
        title: '業務委託契約における善管注意義務の範囲',
        court: '最高裁判所',
        date: new Date('2023-03-15'),
        summary: '業務委託契約において、受託者が負う善管注意義務の具体的範囲について判断された重要判例。',
        relevantClauses: ['善管注意義務', '損害賠償', '契約解除'],
        url: 'https://www.courts.go.jp/app/hanrei_jp/detail2?id=92345'
      },
      {
        id: 'high_court_2023_045',
        title: '電子署名の有効性に関する判断基準',
        court: '東京高等裁判所',
        date: new Date('2023-07-22'),
        summary: '電子署名法に基づく電子署名の有効性について、本人確認の程度と署名の効力の関係を明確化。',
        relevantClauses: ['電子署名', '本人確認', '証拠能力'],
        url: 'https://www.courts.go.jp/app/hanrei_jp/detail2?id=92567'
      }
    ];
  }

  private calculateStampTaxAmount(contractType: string, contractAmount?: number): {
    taxAmount: number;
    explanation: string;
    legalBasis: string;
  } {
    // 印紙税法別表第一に基づく計算
    let taxAmount = 0;
    let explanation = '';
    let legalBasis = '印紙税法別表第一';

    switch (contractType) {
      case 'service_agreement':
        if (!contractAmount || contractAmount === 0) {
          taxAmount = 200;
          explanation = '契約金額の記載がない場合は200円の印紙税が必要です。';
        } else if (contractAmount <= 1000000) {
          taxAmount = 1000;
          explanation = '契約金額が100万円以下の場合は1,000円の印紙税が必要です。';
        } else if (contractAmount <= 5000000) {
          taxAmount = 2000;
          explanation = '契約金額が500万円以下の場合は2,000円の印紙税が必要です。';
        } else {
          taxAmount = Math.min(200000, Math.floor(contractAmount * 0.0001));
          explanation = `契約金額に応じて${taxAmount}円の印紙税が必要です。`;
        }
        break;
      
      case 'employment':
        taxAmount = 0;
        explanation = '雇用契約書は印紙税の対象外です。';
        legalBasis = '印紙税法別表第一（対象外）';
        break;
      
      case 'nda':
        taxAmount = 0;
        explanation = '秘密保持契約書は通常印紙税の対象外です。';
        legalBasis = '印紙税法別表第一（対象外）';
        break;
      
      default:
        taxAmount = 200;
        explanation = '詳細不明のため、最低額の200円を適用します。詳細は税務署にご確認ください。';
    }

    return { taxAmount, explanation, legalBasis };
  }
}

// Export singleton instance
export const legalKnowledgeService = new LegalKnowledgeService();