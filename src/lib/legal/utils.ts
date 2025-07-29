import { Contract } from '@/types/contract';
import { LegalReference, ContractTemplate, LegalUpdate } from './types';
import { ComplianceCheck } from './rag-types';
import { LEGAL_KEYWORDS, LEGAL_TOPICS, QUERY_PATTERNS } from './constants';

/**
 * 契約内容から法的トピックを抽出
 */
export function extractLegalTopicsFromContract(contract: Contract): string[] {
  const topics: string[] = [];
  
  // 契約種別に基づく基本トピック
  const typeTopics = LEGAL_TOPICS[contract.type as keyof typeof LEGAL_TOPICS] || LEGAL_TOPICS.default;
  topics.push(...typeTopics);

  // 契約内容からキーワードを抽出
  const contentKeywords = extractKeywordsFromContent(contract.content);
  topics.push(...contentKeywords);

  return [...new Set(topics)]; // 重複除去
}

/**
 * テキストから法的キーワードを抽出
 */
export function extractKeywordsFromContent(content: string): string[] {
  return LEGAL_KEYWORDS.filter(keyword => content.includes(keyword));
}

/**
 * クエリから法的トピックを抽出
 */
export function extractLegalTopicsFromQuery(query: string): string[] {
  const topics: string[] = [];
  
  // 質問文から法的キーワードを抽出
  const queryKeywords = extractKeywordsFromContent(query);
  topics.push(...queryKeywords);

  // パターンマッチング
  Object.values(QUERY_PATTERNS).forEach(pattern => {
    if (pattern.keywords.some(keyword => query.includes(keyword))) {
      topics.push(...pattern.topics);
    }
  });

  return [...new Set(topics)];
}

/**
 * 拡張コンテキストを構築
 */
export function buildEnhancedContext(
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

/**
 * チャット用コンテキストを構築
 */
export function buildChatContext(
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

/**
 * 基本的なコンプライアンスチェックを実行
 */
export function performBasicComplianceChecks(contract: Contract): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];

  // 契約当事者のチェック
  checks.push({
    id: 'contract_parties',
    title: '契約当事者の明記',
    status: contract.parties.length >= 2 ? 'compliant' : 'warning',
    description: contract.parties.length >= 2 
      ? '契約当事者が適切に明記されています。' 
      : '契約当事者の情報が不完全な可能性があります。',
    legalBasis: '民法第522条（契約の成立）'
  });

  // 電子署名のチェック
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

/**
 * 推奨条項を生成
 */
export function generateRecommendedClauses(
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

/**
 * 回答の信頼度を計算
 */
export function calculateResponseConfidence(response: string, references: LegalReference[]): number {
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