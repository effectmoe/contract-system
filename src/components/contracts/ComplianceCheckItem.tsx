'use client';

import { CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { ComplianceCheck } from '@/lib/legal/rag-types';

interface ComplianceCheckItemProps {
  check: ComplianceCheck;
}

export default function ComplianceCheckItem({ check }: ComplianceCheckItemProps) {
  const getIcon = (status: ComplianceCheck['status']) => {
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

  const getColorClass = (status: ComplianceCheck['status']) => {
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

  return (
    <div className={`border rounded-lg p-4 ${getColorClass(check.status)}`}>
      <div className="flex items-start gap-3">
        {getIcon(check.status)}
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
  );
}