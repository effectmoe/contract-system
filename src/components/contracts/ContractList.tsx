'use client';

import Link from 'next/link';
import { ChevronRight, Calendar, Clock, CheckCircle, AlertCircle, Building2, FileText } from 'lucide-react';
import { Contract, ContractStatus } from '@/types/contract';
import { CONTRACT_STATUS_LABELS, STATUS_COLORS } from '@/lib/utils/constants';

interface ContractListProps {
  contracts: Contract[];
  loading?: boolean;
}

export default function ContractList({ contracts, loading }: ContractListProps) {
  const getStatusIcon = (status: ContractStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending_signature':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadgeClass = (status: ContractStatus) => {
    const colors = STATUS_COLORS[status] || STATUS_COLORS.draft;
    return `inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors}`;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return '-';
    return `¥${amount.toLocaleString()}`;
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="divide-y divide-gray-200">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="h-6 w-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            契約書が見つかりません
          </h3>
          <p className="text-gray-500 mb-6">
            条件に一致する契約書がありません。フィルタを調整するか、新しい契約書を作成してください。
          </p>
          <Link
            href="/contracts/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            新規契約作成
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          契約書一覧 ({contracts.length}件)
        </h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {contracts.map((contract) => {
          const clientParty = contract.parties.find(p => p.type === 'client');
          
          return (
            <Link
              key={contract.contractId}
              href={`/contracts/${contract.contractId}`}
              className="block p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900 truncate">
                        {contract.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        ID: {contract.contractId}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className={getStatusBadgeClass(contract.status)}>
                        {getStatusIcon(contract.status)}
                        {CONTRACT_STATUS_LABELS[contract.status]}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>
                        {clientParty?.company || clientParty?.name || '未設定'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>作成: {formatDate(contract.createdAt)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>更新: {formatDate(contract.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-sm">
                      {contract.priority && (
                        <span className={`font-medium ${getPriorityColor(contract.priority)}`}>
                          優先度: {contract.priority === 'high' ? '高' : contract.priority === 'medium' ? '中' : '低'}
                        </span>
                      )}
                      
                      {contract.transactionAmount && (
                        <span className="text-gray-900 font-medium">
                          {formatAmount(contract.transactionAmount)}
                        </span>
                      )}
                      
                      {contract.category && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {contract.category}
                        </span>
                      )}
                    </div>

                    {contract.tags && contract.tags.length > 0 && (
                      <div className="flex gap-2">
                        {contract.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {contract.tags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{contract.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="ml-4 flex-shrink-0">
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}