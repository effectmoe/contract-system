'use client';

import { Brain, Scale, CheckCircle, FileText, TrendingUp, RefreshCw } from 'lucide-react';
import { EnhancedAnalysis } from '@/lib/legal/rag-types';

interface AnalysisSummaryCardProps {
  analysis: EnhancedAnalysis;
  onRunAnalysis: () => Promise<void>;
  isAnalyzing: boolean;
}

export default function AnalysisSummaryCard({
  analysis,
  onRunAnalysis,
  isAnalyzing
}: AnalysisSummaryCardProps) {
  return (
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
        <SummaryMetric
          icon={<Scale className="w-6 h-6 text-blue-600" />}
          label="法的参照"
          value={analysis.legalReferences.length}
          color="blue"
        />
        <SummaryMetric
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          label="コンプライアンス"
          value={analysis.complianceChecks.length}
          color="green"
        />
        <SummaryMetric
          icon={<FileText className="w-6 h-6 text-purple-600" />}
          label="推奨条項"
          value={analysis.recommendedClauses.length}
          color="purple"
        />
        <SummaryMetric
          icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
          label="法改正情報"
          value={analysis.relatedUpdates.length}
          color="orange"
        />
      </div>
    </div>
  );
}

interface SummaryMetricProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function SummaryMetric({ icon, label, value, color }: SummaryMetricProps) {
  const colorClass = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  }[color];

  return (
    <div className="bg-gray-50 p-3 rounded-lg text-center">
      <div className="mx-auto mb-1">{icon}</div>
      <div className="text-sm font-medium text-gray-900">{label}</div>
      <div className={`text-lg font-bold ${colorClass}`}>{value}</div>
    </div>
  );
}