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

export interface StampTaxResult {
  taxAmount: number;
  explanation: string;
  legalBasis: string;
}

// 定数の定義
export const LEGAL_API_CONFIG = {
  egovApiBase: 'https://elaws.e-gov.go.jp/api/1',
  cachePrefix: 'legal_kb',
} as const;

// 印紙税の税額テーブル
export const STAMP_TAX_TABLE = {
  service_agreement: [
    { maxAmount: 0, tax: 200, explanation: '契約金額の記載がない場合は200円の印紙税が必要です。' },
    { maxAmount: 1000000, tax: 1000, explanation: '契約金額が100万円以下の場合は1,000円の印紙税が必要です。' },
    { maxAmount: 5000000, tax: 2000, explanation: '契約金額が500万円以下の場合は2,000円の印紙税が必要です。' },
  ],
  employment: { tax: 0, explanation: '雇用契約書は印紙税の対象外です。', legalBasis: '印紙税法別表第一（対象外）' },
  nda: { tax: 0, explanation: '秘密保持契約書は通常印紙税の対象外です。', legalBasis: '印紙税法別表第一（対象外）' },
} as const;