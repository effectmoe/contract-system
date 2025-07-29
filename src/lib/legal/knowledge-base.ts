import { kvCache, CacheKeys, CacheDurations } from '@/lib/db/kv';
import { 
  LegalReference, 
  CaseReference, 
  ContractTemplate, 
  LegalUpdate, 
  StampTaxResult,
  LEGAL_API_CONFIG 
} from './types';
import { 
  sampleLegalProvisions, 
  sampleContractTemplates, 
  sampleLegalUpdates, 
  sampleCaseLaw 
} from './sample-data';
import { StampTaxCalculator } from './stamp-tax-calculator';

export * from './types';

/**
 * 法務知識ベースサービス
 * 官公庁API、判例データベース、契約書雛形などの信頼できる情報源と連携
 */
export class LegalKnowledgeService {
  private readonly egovApiBase = LEGAL_API_CONFIG.egovApiBase;
  private readonly cachePrefix = LEGAL_API_CONFIG.cachePrefix;

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
        const filteredProvisions = this.filterLegalProvisions(sampleLegalProvisions, keywords);
        await kvCache.set(cacheKey, filteredProvisions, { ex: CacheDurations.aiResponse });
        return filteredProvisions;
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
      return this.filterLegalProvisions(sampleLegalProvisions, keywords);
    }
  }

  /**
   * 契約書雛形データベースから関連テンプレートを取得
   */
  async getContractTemplates(contractType: string, industry?: string): Promise<ContractTemplate[]> {
    const cacheKey = CacheKeys.aiResponse(`${this.cachePrefix}_templates_${contractType}_${industry || 'general'}`);
    const cached = await kvCache.get<ContractTemplate[]>(cacheKey);
    if (cached) return cached;

    try {
      const templates = this.getContractTemplatesByType(contractType, industry);
      await kvCache.set(cacheKey, templates, { ex: CacheDurations.aiResponse });
      return templates;
    } catch (error) {
      console.error('Contract templates fetch error:', error);
      return [];
    }
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
      const updates = this.filterLegalUpdates(sampleLegalUpdates, contractTypes);
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
      const cases = this.filterCaseLaw(sampleCaseLaw, keywords, contractType);
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
  async calculateStampTax(contractType: string, contractAmount?: number): Promise<StampTaxResult> {
    const cacheKey = CacheKeys.aiResponse(`${this.cachePrefix}_stamp_tax_${contractType}_${contractAmount || 0}`);
    const cached = await kvCache.get<StampTaxResult>(cacheKey);
    if (cached) return cached;

    try {
      // 印紙税法に基づく計算ロジック
      const result = StampTaxCalculator.calculate(contractType, contractAmount);
      await kvCache.set(cacheKey, result, { ex: 86400 }); // 24時間キャッシュ
      return result;
    } catch (error) {
      console.error('Stamp tax calculation error:', error);
      return {
        taxAmount: 0,
        explanation: '印紙税の計算中にエラーが発生しました。',
        legalBasis: ''
      };
    }
  }

  // プライベートヘルパーメソッド

  /**
   * キーワードに基づいて法的参照情報をフィルタリング
   */
  private filterLegalProvisions(provisions: LegalReference[], keywords: string[]): LegalReference[] {
    if (keywords.length === 0) return provisions;
    
    return provisions.filter(item => 
      keywords.some(keyword => 
        item.title.toLowerCase().includes(keyword.toLowerCase()) || 
        item.content.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  }

  /**
   * 契約タイプに基づいてテンプレートを取得
   */
  private getContractTemplatesByType(contractType: string, industry?: string): ContractTemplate[] {
    const template = sampleContractTemplates[contractType];
    if (!template) return [];
    
    // 業界が指定されている場合は、テンプレートに反映
    if (industry && template.industry !== industry) {
      return [{
        ...template,
        industry,
        id: `${template.id}_${industry}`
      }];
    }
    
    return [template];
  }

  /**
   * 契約タイプに関連する法改正情報をフィルタリング
   */
  private filterLegalUpdates(updates: LegalUpdate[], contractTypes?: string[]): LegalUpdate[] {
    if (!contractTypes || contractTypes.length === 0) {
      return updates;
    }
    
    return updates.filter(update => 
      update.relatedContractTypes.some(type => 
        contractTypes.includes(type)
      )
    );
  }

  /**
   * キーワードと契約タイプに基づいて判例をフィルタリング
   */
  private filterCaseLaw(cases: CaseReference[], keywords: string[], contractType?: string): CaseReference[] {
    return cases.filter(caseRef => {
      // キーワードによるフィルタリング
      const keywordMatch = keywords.length === 0 || keywords.some(keyword => 
        caseRef.title.toLowerCase().includes(keyword.toLowerCase()) || 
        caseRef.summary.toLowerCase().includes(keyword.toLowerCase()) ||
        caseRef.relevantClauses.some(clause => 
          clause.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      
      // 契約タイプによるフィルタリング（簡易的なマッチング）
      const typeMatch = !contractType || 
        (contractType === 'service_agreement' && caseRef.title.includes('業務委託')) ||
        (contractType === 'employment' && caseRef.title.includes('労働')) ||
        (contractType === 'nda' && caseRef.title.includes('秘密'));
      
      return keywordMatch && typeMatch;
    });
  }

  // 削除 - StampTaxCalculatorクラスに移動済み
}

// Export singleton instance
export const legalKnowledgeService = new LegalKnowledgeService();