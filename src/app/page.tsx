'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Plus, TrendingUp, DollarSign, Filter, Calendar, CheckCircle, Clock, AlertCircle, List, BarChart } from 'lucide-react';
import { Contract, ContractStatus } from '@/types/contract';
import { CONTRACT_STATUS_LABELS } from '@/lib/utils/constants';

interface DashboardStats {
  total: number;
  draft: number;
  pending_signature: number;
  completed: number;
  expiring_soon: number;
  completedCount: number; // 締結件数
  totalRevenue: number; // 売上合計
}

export default function Home() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    draft: 0,
    pending_signature: 0,
    completed: 0,
    expiring_soon: 0,
    completedCount: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/contracts');
      const data = await response.json();
      setContracts(data.data || []);
      calculateStats(data.data || []);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (contractList: Contract[]) => {
    const newStats: DashboardStats = {
      total: contractList.length,
      draft: 0,
      pending_signature: 0,
      completed: 0,
      expiring_soon: 0,
      completedCount: 0,
      totalRevenue: 0,
    };

    contractList.forEach(contract => {
      if (contract.status === 'draft') newStats.draft++;
      if (contract.status === 'pending_signature') newStats.pending_signature++;
      if (contract.status === 'completed') {
        newStats.completed++;
        newStats.completedCount++;
        newStats.totalRevenue += contract.transactionAmount || 0;
      }
      
      // Check if expiring within 7 days
      if (contract.signatureExpiresAt) {
        const expiryDate = new Date(contract.signatureExpiresAt);
        const daysUntilExpiry = (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (daysUntilExpiry > 0 && daysUntilExpiry <= 7) {
          newStats.expiring_soon++;
        }
      }
    });

    setStats(newStats);
  };

  const getFilteredContracts = () => {
    let filtered = contracts;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    // 締結済み契約のみ表示
    filtered = filtered.filter(c => c.status === 'completed');
    
    // ソート
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.completedAt || b.updatedAt).getTime() - new Date(a.completedAt || a.updatedAt).getTime();
      } else {
        return (b.transactionAmount || 0) - (a.transactionAmount || 0);
      }
    });
    
    return filtered.slice(0, 10); // 最新10件
  };

  const getStatusIcon = (status: ContractStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending_signature':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusBadgeClass = (status: ContractStatus) => {
    const baseClass = "badge";
    switch (status) {
      case 'draft':
        return `${baseClass} badge-draft`;
      case 'pending_signature':
        return `${baseClass} badge-pending`;
      case 'completed':
        return `${baseClass} badge-completed`;
      default:
        return baseClass;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AAM契約書システム
          </h1>
          <p className="text-lg text-gray-600">
            契約管理の一元化と効率化を実現
          </p>
        </div>

        {/* 大きなアクションボタン */}
        <div className="grid md:grid-cols-2 gap-6 mb-8 max-w-4xl mx-auto">
          <Link
            href="/contracts"
            className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-transparent hover:border-blue-500"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <List className="w-12 h-12 text-blue-600" />
                <span className="text-3xl font-bold text-gray-900">{stats.total}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">契約書管理</h2>
              <p className="text-gray-600">既存の契約書を一覧表示・管理</p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>

          <Link
            href="/contracts/new"
            className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-transparent hover:border-green-500"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <Plus className="w-12 h-12 text-green-600" />
                <FileText className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">新規契約作成</h2>
              <p className="text-gray-600">新しい契約書を作成</p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
        </div>

        {/* 統計カード */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">締結件数</p>
                <p className="text-3xl font-bold text-gray-900">{stats.completedCount}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">契約書売上</p>
                <p className="text-2xl font-bold text-gray-900">¥{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">署名待ち</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending_signature}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">期限間近</p>
                <p className="text-3xl font-bold text-red-600">{stats.expiring_soon}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
          </div>
        </div>

        {/* 最近の締結済み契約 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart className="w-6 h-6" />
              最近の締結済み契約
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('date')}
                className={`px-3 py-1 rounded ${sortBy === 'date' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
              >
                日付順
              </button>
              <button
                onClick={() => setSortBy('amount')}
                className={`px-3 py-1 rounded ${sortBy === 'amount' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
              >
                金額順
              </button>
            </div>
          </div>

          {getFilteredContracts().length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">締結済みの契約書はまだありません</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">契約書名</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">相手方</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">金額</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">締結日</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">ステータス</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredContracts().map((contract) => (
                    <tr key={contract._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link href={`/contracts/${contract.contractId}`} className="text-blue-600 hover:underline">
                          {contract.title}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        {contract.parties.find(p => p.type === 'client')?.company || contract.parties.find(p => p.type === 'client')?.name || '-'}
                      </td>
                      <td className="py-3 px-4">
                        {contract.transactionAmount ? `¥${contract.transactionAmount.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {new Date(contract.completedAt || contract.updatedAt).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={getStatusBadgeClass(contract.status)}>
                          {getStatusIcon(contract.status)}
                          {CONTRACT_STATUS_LABELS[contract.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 text-center">
            <Link href="/contracts" className="text-blue-600 hover:underline">
              すべての契約書を見る →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}