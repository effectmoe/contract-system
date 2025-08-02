'use client';

import { Clock, CheckCircle, FileText, AlertCircle } from 'lucide-react';
import { ContractStatus } from '@/types/contract';

interface ContractStatsProps {
  stats: {
    total: number;
    draft: number;
    pending_signature: number;
    completed: number;
    expiring_soon: number;
  };
  loading?: boolean;
  onStatClick?: (status: ContractStatus | 'all' | 'expiring_soon') => void;
}

export default function ContractStats({ stats, loading, onStatClick }: ContractStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: '総契約数',
      value: stats.total,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      statusFilter: 'all' as const,
    },
    {
      label: '下書き',
      value: stats.draft,
      icon: FileText,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      statusFilter: 'draft' as ContractStatus,
    },
    {
      label: '署名待ち',
      value: stats.pending_signature,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      statusFilter: 'pending_signature' as ContractStatus,
    },
    {
      label: '完了',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      statusFilter: 'completed' as ContractStatus,
    },
    {
      label: '期限間近',
      value: stats.expiring_soon,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      statusFilter: 'expiring_soon' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {statItems.map((item, index) => (
        <div 
          key={index} 
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
          onClick={() => onStatClick?.(item.statusFilter)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {item.label}
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {item.value.toLocaleString()}
              </p>
            </div>
            <div className={`p-3 rounded-full ${item.bgColor}`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}