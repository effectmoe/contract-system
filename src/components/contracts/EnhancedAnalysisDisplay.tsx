'use client';

import { useState } from 'react';
import { 
  Brain, AlertTriangle, CheckCircle, FileText, DollarSign,
  RefreshCw, BookOpen, TrendingUp, ExternalLink
} from 'lucide-react';
import { EnhancedAnalysis } from '@/lib/legal/rag-types';
import AnalysisSection from './AnalysisSection';
import ComplianceCheckItem from './ComplianceCheckItem';
import AnalysisSummaryCard from './AnalysisSummaryCard';
import { getRiskColor, getImpactLevelColor } from './utils/analysisUtils';

interface EnhancedAnalysisDisplayProps {
  contractId: string;
  analysis?: EnhancedAnalysis | null;
  onRunAnalysis: () => Promise<void>;
  isAnalyzing: boolean;
}

export default function EnhancedAnalysisDisplay({
  contractId,
  analysis,
  onRunAnalysis,
  isAnalyzing
}: EnhancedAnalysisDisplayProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    compliance: true,
    references: false,
    recommendations: true,
    stampTax: false,
    updates: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!analysis) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            拡張AI分析
          </h3>
          <p className="text-gray-600 mb-6">
            法務知識ベースと連携した詳細な契約書分析を実行できます
          </p>
          <button
            onClick={onRunAnalysis}
            disabled={isAnalyzing}
            className="btn-primary flex items-center gap-2 mx-auto"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                拡張分析実行
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnalysisSummaryCard
        analysis={analysis}
        onRunAnalysis={onRunAnalysis}
        isAnalyzing={isAnalyzing}
      />

      {/* コンプライアンスチェック */}
      <AnalysisSection
        title="コンプライアンスチェック"
        icon={<CheckCircle className="w-5 h-5 text-green-600" />}
        isExpanded={expandedSections.compliance}
        onToggle={() => toggleSection('compliance')}
      >
        <div className="space-y-3">
          {analysis.complianceChecks.map((check) => (
            <ComplianceCheckItem key={check.id} check={check} />
          ))}
        </div>
      </AnalysisSection>

      {/* 法的参照情報 */}
      <AnalysisSection
        title="法的参照情報"
        icon={<BookOpen className="w-5 h-5 text-blue-600" />}
        isExpanded={expandedSections.references}
        onToggle={() => toggleSection('references')}
        count={analysis.legalReferences.length}
      >
        <div className="space-y-3">
          {analysis.legalReferences.map((ref) => (
            <LegalReferenceItem key={ref.id} reference={ref} />
          ))}
        </div>
      </AnalysisSection>

      {/* 推奨条項 */}
      <AnalysisSection
        title="推奨条項・改善提案"
        icon={<FileText className="w-5 h-5 text-purple-600" />}
        isExpanded={expandedSections.recommendations}
        onToggle={() => toggleSection('recommendations')}
      >
        <div className="space-y-3">
          {analysis.recommendedClauses.map((clause, index) => (
            <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-sm text-purple-800">{clause}</p>
            </div>
          ))}
        </div>
      </AnalysisSection>

      {/* 印紙税情報 */}
      <AnalysisSection
        title="印紙税情報"
        icon={<DollarSign className="w-5 h-5 text-green-600" />}
        isExpanded={expandedSections.stampTax}
        onToggle={() => toggleSection('stampTax')}
      >
        <StampTaxInfo stampTaxInfo={analysis.stampTaxInfo} />
      </AnalysisSection>

      {/* 関連する法改正情報 */}
      {analysis.relatedUpdates.length > 0 && (
        <AnalysisSection
          title="関連する法改正情報"
          icon={<TrendingUp className="w-5 h-5 text-orange-600" />}
          isExpanded={expandedSections.updates}
          onToggle={() => toggleSection('updates')}
        >
          <div className="space-y-3">
            {analysis.relatedUpdates.map((update) => (
              <LegalUpdateItem key={update.id} update={update} />
            ))}
          </div>
        </AnalysisSection>
      )}

      {/* リスク評価 */}
      {analysis.risks.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            リスク評価
          </h3>
          <div className="space-y-3">
            {analysis.risks.map((risk, index) => (
              <div
                key={index}
                className={`border rounded-lg p-3 ${getRiskColor(risk.level)}`}
              >
                <div className="flex items-start gap-2">
                  <span className="font-medium text-sm">
                    {risk.level === 'high' ? '高' : risk.level === 'medium' ? '中' : '低'}リスク:
                  </span>
                  <span className="text-sm">{risk.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 内部コンポーネント

interface LegalReferenceItemProps {
  reference: any;
}

function LegalReferenceItem({ reference }: LegalReferenceItemProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-2">{reference.title}</h4>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            {reference.content}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {reference.source}
              </span>
              <span className="text-xs text-gray-500">
                関連度: {Math.round(reference.relevanceScore * 100)}%
              </span>
            </div>
            {reference.url && (
              <a
                href={reference.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                詳細確認
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StampTaxInfoProps {
  stampTaxInfo: any;
}

function StampTaxInfo({ stampTaxInfo }: StampTaxInfoProps) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-green-900">印紙税額</span>
        <span className="text-2xl font-bold text-green-700">
          ¥{stampTaxInfo.taxAmount.toLocaleString()}
        </span>
      </div>
      <p className="text-sm text-green-800 mb-3">
        {stampTaxInfo.explanation}
      </p>
      <div className="text-xs text-green-700">
        <strong>法的根拠:</strong> {stampTaxInfo.legalBasis}
      </div>
    </div>
  );
}

interface LegalUpdateItemProps {
  update: any;
}

function LegalUpdateItem({ update }: LegalUpdateItemProps) {
  const { containerClass, badgeClass, label } = getImpactLevelColor(update.impactLevel);
  
  return (
    <div className={`border rounded-lg p-4 ${containerClass}`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900">{update.title}</h4>
        <span className={`text-xs px-2 py-1 rounded font-medium ${badgeClass}`}>
          {label}影響
        </span>
      </div>
      <p className="text-sm text-gray-700 mb-2">{update.summary}</p>
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>施行日: {new Date(update.effectiveDate).toLocaleDateString('ja-JP')}</span>
        <span>出典: {update.source}</span>
      </div>
    </div>
  );
}