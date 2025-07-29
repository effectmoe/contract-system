import { LegalReference, ContractTemplate, LegalUpdate, CaseReference } from './types';

export const sampleLegalProvisions: LegalReference[] = [
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

export const sampleContractTemplates: Record<string, ContractTemplate> = {
  service_agreement: {
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
    source: 'internal'
  },
  nda: {
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
    source: 'internal'
  }
};

export const sampleLegalUpdates: LegalUpdate[] = [
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

export const sampleCaseLaw: CaseReference[] = [
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