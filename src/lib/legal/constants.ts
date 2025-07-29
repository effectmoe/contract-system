// 法的トピックの定数
export const LEGAL_TOPICS = {
  service_agreement: ['業務委託', '善管注意義務', '損害賠償', '契約解除'],
  employment: ['雇用契約', '労働基準法', '就業規則', '解雇'],
  nda: ['秘密保持', '機密情報', '競業禁止', '損害賠償'],
  default: ['契約', '民法', '債務不履行']
} as const;

export const LEGAL_KEYWORDS = [
  '契約期間', '更新', '解除', '損害賠償', '責任', '義務', '権利',
  '支払い', '報酬', '対価', '成果物', '著作権', '知的財産',
  '秘密保持', '競業禁止', '準拠法', '管轄裁判所'
] as const;

export const QUERY_PATTERNS = {
  cancellation: {
    keywords: ['解除', 'キャンセル'],
    topics: ['契約解除', '民法第545条']
  },
  damages: {
    keywords: ['損害', '賠償'],
    topics: ['損害賠償', '民法第415条']
  },
  stampTax: {
    keywords: ['印紙', '税'],
    topics: ['印紙税', '印紙税法']
  }
} as const;

export const RISK_MITIGATION_SUGGESTIONS = [
  '契約解除条項の明確化により、予期しない状況に対応できます。',
  '損害賠償条項の上限設定により、過度なリスクを回避できます。',
  '不可抗力条項の追加により、天災等による履行不能リスクを軽減できます。',
  '準拠法と管轄裁判所の明記により、紛争時の対応を明確にできます。'
] as const;