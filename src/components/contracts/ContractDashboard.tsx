'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, Plus, Search, Filter, Calendar, Clock, 
  CheckCircle, XCircle, AlertCircle, ChevronRight, Database 
} from 'lucide-react';
import { Contract, ContractStatus } from '@/types/contract';
import { CONTRACT_STATUS_LABELS, STATUS_COLORS } from '@/lib/utils/constants';

interface DashboardStats {
  total: number;
  draft: number;
  pending_signature: number;
  completed: number;
  expiring_soon: number;
}

export default function ContractDashboard() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    draft: 0,
    pending_signature: 0,
    completed: 0,
    expiring_soon: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [creatingDemoData, setCreatingDemoData] = useState(false);

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
    };

    contractList.forEach(contract => {
      if (contract.status === 'draft') newStats.draft++;
      if (contract.status === 'pending_signature') newStats.pending_signature++;
      if (contract.status === 'completed') newStats.completed++;
      
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

  const createDemoData = async () => {
    setCreatingDemoData(true);
    try {
      const response = await fetch('/api/demo/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('デモデータを作成しました！');
        await fetchContracts(); // データを再読み込み
      } else {
        alert(`エラー: ${data.error || 'デモデータの作成に失敗しました'}`);
      }
    } catch (error) {
      alert('デモデータの作成に失敗しました');
    } finally {
      setCreatingDemoData(false);
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = searchQuery === '' || 
      contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.contractId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.parties.some(party => 
        party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        party.email.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: ContractStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
      case 'expired':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusBadgeClass = (status: ContractStatus) => {
    const baseClass = "badge";
    switch (status) {
      case 'draft':
        return `${baseClass} badge-draft`;
      case 'pending_review':
      case 'pending_signature':
      case 'partially_signed':
        return `${baseClass} badge-pending`;
      case 'completed':
        return `${baseClass} badge-completed`;
      case 'cancelled':
      case 'expired':
        return `${baseClass} badge-cancelled`;
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">契約書ダッシュボード</h1>
        <div className="flex gap-3">
          {stats.total === 0 && (
            <button
              onClick={createDemoData}
              disabled={creatingDemoData}
              className="btn-secondary flex items-center gap-2"
            >
              {creatingDemoData ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              ) : (
                <Database className="w-4 h-4" />
              )}
              デモデータ作成
            </button>
          )}
          <Link href="/contracts/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新規契約書作成
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">総契約数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">下書き</p>
              <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">署名待ち</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending_signature}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">完了</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">期限間近</p>
              <p className="text-2xl font-bold text-red-600">{stats.expiring_soon}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="契約書名、契約ID、相手方名で検索..."
                className="input pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ContractStatus | 'all')}
            >
              <option value="all">すべてのステータス</option>
              <option value="draft">下書き</option>
              <option value="pending_review">レビュー待ち</option>
              <option value="pending_signature">署名待ち</option>
              <option value="partially_signed">一部署名済み</option>
              <option value="completed">完了</option>
              <option value="cancelled">キャンセル</option>
              <option value="expired">期限切れ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contracts List */}
      <div className="space-y-4">
        {filteredContracts.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">契約書が見つかりませんでした</p>
            {contracts.length === 0 && (
              <button
                onClick={createDemoData}
                disabled={creatingDemoData}
                className="btn-primary flex items-center gap-2 mx-auto"
              >
                {creatingDemoData ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Database className="w-4 h-4" />
                )}
                デモデータを作成
              </button>
            )}
          </div>
        ) : (
          filteredContracts.map((contract) => (
            <Link
              key={contract._id}
              href={`/contracts/${contract.contractId}`}
              className="card hover:shadow-lg transition-shadow block"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {contract.title}
                    </h3>
                    <span className={getStatusBadgeClass(contract.status)}>
                      {getStatusIcon(contract.status)}
                      {CONTRACT_STATUS_LABELS[contract.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>ID: {contract.contractId}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(contract.createdAt).toLocaleDateString('ja-JP')}
                    </span>
                    {contract.parties.length > 0 && (
                      <span>
                        相手方: {contract.parties.find(p => p.type === 'client')?.name || '-'}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}