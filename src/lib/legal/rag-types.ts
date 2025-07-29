import { AIAnalysis } from '@/types/contract';
import { LegalReference, LegalUpdate, StampTaxResult } from './types';

/**
 * 拡張されたAI分析結果
 */
export interface EnhancedAnalysis extends AIAnalysis {
  legalReferences: LegalReference[];
  recommendedClauses: string[];
  complianceChecks: ComplianceCheck[];
  stampTaxInfo: StampTaxResult;
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

export interface ClauseOptimization {
  id: string;
  title: string;
  currentIssue: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  legalBasis: string;
}

export interface LegalChatResponse {
  response: string;
  references: LegalReference[];
  confidence: number;
}

export interface OptimizationResult {
  suggestions: ClauseOptimization[];
  riskMitigation: string[];
  legalCompliance: string[];
}