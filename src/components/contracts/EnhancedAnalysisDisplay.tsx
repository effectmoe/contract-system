'use client';

import { useState } from 'react';
import { 
  Brain, Scale, AlertTriangle, CheckCircle, Info, 
  ExternalLink, TrendingUp, FileText, DollarSign,
  RefreshCw, ChevronDown, ChevronUp, BookOpen
} from 'lucide-react';
import { EnhancedAnalysis, ComplianceCheck, StampTaxInfo } from '@/lib/legal/rag-service';
import { LegalReference, LegalUpdate } from '@/lib/legal/knowledge-base';

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

  const getComplianceIcon = (status: ComplianceCheck['status']) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'non_compliant':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getComplianceColor = (status: ComplianceCheck['status']) => {
    switch (status) {
      case 'compliant':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'non_compliant':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
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
      {/* 分析概要 */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            拡張AI分析結果
          </h3>
          <button
            onClick={onRunAnalysis}
            disabled={isAnalyzing}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            {isAnalyzing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            再分析
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-blue-900 mb-2">要約</h4>
          <p className="text-blue-800 text-sm leading-relaxed">{analysis.summary}</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <Scale className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <div className="text-sm font-medium text-gray-900">法的参照</div>
            <div className="text-lg font-bold text-blue-600">{analysis.legalReferences.length}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <div className="text-sm font-medium text-gray-900">コンプライアンス</div>
            <div className="text-lg font-bold text-green-600">{analysis.complianceChecks.length}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <FileText className="w-6 h-6 text-purple-600 mx-auto mb-1" />
            <div className="text-sm font-medium text-gray-900">推奨条項</div>
            <div className="text-lg font-bold text-purple-600">{analysis.recommendedClauses.length}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <TrendingUp className="w-6 h-6 text-orange-600 mx-auto mb-1" />
            <div className="text-sm font-medium text-gray-900">法改正情報</div>
            <div className="text-lg font-bold text-orange-600">{analysis.relatedUpdates.length}</div>
          </div>
        </div>
      </div>

      {/* コンプライアンスチェック */}
      <div className="card">
        <button
          onClick={() => toggleSection('compliance')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            コンプライアンスチェック
          </h3>
          {expandedSections.compliance ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSections.compliance && (
          <div className="px-4 pb-4 space-y-3">
            {analysis.complianceChecks.map((check) => (
              <div
                key={check.id}
                className={`border rounded-lg p-4 ${getComplianceColor(check.status)}`}
              >
                <div className="flex items-start gap-3">
                  {getComplianceIcon(check.status)}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{check.title}</h4>
                    <p className="text-sm text-gray-700 mb-2">{check.description}</p>
                    {check.recommendation && (
                      <div className="bg-white bg-opacity-50 rounded p-2 mt-2">
                        <p className="text-sm font-medium text-gray-800">推奨事項:</p>
                        <p className="text-sm text-gray-700">{check.recommendation}</p>
                      </div>
                    )}
                    <div className="mt-2">
                      <span className="text-xs font-medium text-gray-600">
                        法的根拠: {check.legalBasis}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 法的参照情報 */}
      <div className="card">
        <button
          onClick={() => toggleSection('references')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            法的参照情報 ({analysis.legalReferences.length})
          </h3>
          {expandedSections.references ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSections.references && (
          <div className="px-4 pb-4 space-y-3">
            {analysis.legalReferences.map((ref) => (
              <div key={ref.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-2">{ref.title}</h4>
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">
                      {ref.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {ref.source}
                        </span>
                        <span className="text-xs text-gray-500">
                          関連度: {Math.round(ref.relevanceScore * 100)}%
                        </span>
                      </div>
                      {ref.url && (
                        <a
                          href={ref.url}
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
            ))}
          </div>
        )}
      </div>

      {/* 推奨条項 */}
      <div className="card">
        <button
          onClick={() => toggleSection('recommendations')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            推奨条項・改善提案
          </h3>
          {expandedSections.recommendations ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSections.recommendations && (
          <div className="px-4 pb-4">
            <div className="space-y-3">
              {analysis.recommendedClauses.map((clause, index) => (
                <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-sm text-purple-800">{clause}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 印紙税情報 */}
      <div className="card">
        <button
          onClick={() => toggleSection('stampTax')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            印紙税情報
          </h3>
          {expandedSections.stampTax ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSections.stampTax && (
          <div className="px-4 pb-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-green-900">印紙税額</span>
                <span className="text-2xl font-bold text-green-700">
                  ¥{analysis.stampTaxInfo.taxAmount.toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-green-800 mb-3">
                {analysis.stampTaxInfo.explanation}
              </p>
              <div className="text-xs text-green-700">
                <strong>法的根拠:</strong> {analysis.stampTaxInfo.legalBasis}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 関連する法改正情報 */}
      {analysis.relatedUpdates.length > 0 && (
        <div className="card">
          <button
            onClick={() => toggleSection('updates')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              関連する法改正情報
            </h3>
            {expandedSections.updates ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.updates && (
            <div className="px-4 pb-4 space-y-3">
              {analysis.relatedUpdates.map((update) => (
                <div
                  key={update.id}
                  className={`border rounded-lg p-4 ${
                    update.impactLevel === 'high'
                      ? 'border-red-200 bg-red-50'
                      : update.impactLevel === 'medium'
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{update.title}</h4>
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ${
                        update.impactLevel === 'high'
                          ? 'bg-red-100 text-red-800'
                          : update.impactLevel === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {update.impactLevel === 'high' ? '高' : 
                       update.impactLevel === 'medium' ? '中' : '低'}影響
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{update.summary}</p>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>施行日: {update.effectiveDate.toLocaleDateString('ja-JP')}</span>
                    <span>出典: {update.source}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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