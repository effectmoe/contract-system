'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { ReactNode } from 'react';

interface AnalysisSectionProps {
  title: string;
  icon: ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  count?: number;
}

export default function AnalysisSection({
  title,
  icon,
  isExpanded,
  onToggle,
  children,
  count
}: AnalysisSectionProps) {
  return (
    <div className="card">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {icon}
          {title}
          {count !== undefined && ` (${count})`}
        </h3>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
}