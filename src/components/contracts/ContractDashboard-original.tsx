'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, Plus, Search, Filter, Calendar, Clock, 
  CheckCircle, XCircle, AlertCircle, ChevronRight, Database,
  Building2, Tag, SortAsc, SortDesc, Grid, List
} from 'lucide-react';
import { Contract, ContractStatus } from '@/types/contract';
import { CONTRACT_STATUS_LABELS, STATUS_COLORS, CONTRACT_TYPE_LABELS } from '@/lib/utils/constants';

interface DashboardStats {
  total: number;
  draft: number;
  pending_signature: number;
  completed: number;
  expiring_soon: number;
}

type SortOption = 'createdAt' | 'updatedAt' | 'title' | 'company' | 'priority' | 'amount';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'list' | 'grid' | 'company';

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
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
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

  // Filter and sort logic
  const filteredAndSortedContracts = () => {
    let filtered = contracts.filter(contract => {
      const matchesSearch = searchQuery === '' || 
        contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.contractId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.parties.some(party => 
          party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          party.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (party.company && party.company.toLowerCase().includes(searchQuery.toLowerCase()))
        ) ||
        (contract.tags && contract.tags.some(tag => 
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        ));

      const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || contract.category === categoryFilter;
      const matchesPriority = priorityFilter === 'all' || contract.priority === priorityFilter;
      const matchesTag = tagFilter === 'all' || (contract.tags && contract.tags.includes(tagFilter));

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority && matchesTag;
    });

    // Sort contracts
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'company':
          aValue = (a.parties.find(p => p.type === 'client')?.company || '').toLowerCase();
          bValue = (b.parties.find(p => p.type === 'client')?.company || '').toLowerCase();
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'amount':
          aValue = a.transactionAmount || 0;
          bValue = b.transactionAmount || 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
        default:
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  };

  const filteredContracts = filteredAndSortedContracts();

  // Get unique values for filter options
  const getUniqueCategories = () => {
    const categories = contracts.map(c => c.category).filter(Boolean);
    return [...new Set(categories)];
  };

  const getUniqueTags = () => {
    const tags = contracts.flatMap(c => c.tags || []);
    return [...new Set(tags)];
  };

  const getUniqueCompanies = () => {
    const companies = contracts.flatMap(c => 
      c.parties.filter(p => p.type === 'client').map(p => p.company).filter(Boolean)
    );
    return [...new Set(companies)];
  };

  // Group contracts by company for company view
  const groupedByCompany = () => {
    const groups: { [company: string]: Contract[] } = {};
    filteredContracts.forEach(contract => {
      const clientParty = contract.parties.find(p => p.type === 'client');
      const company = clientParty?.company || '未分類';
      if (!groups[company]) {
        groups[company] = [];
      }
      groups[company].push(contract);
    });
    return groups;
  };

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

  const getPriorityBadgeClass = (priority?: string) => {
    const baseClass = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
    switch (priority) {
      case 'high':
        return `${baseClass} bg-red-100 text-red-800`;
      case 'medium':
        return `${baseClass} bg-yellow-100 text-yellow-800`;
      case 'low':
        return `${baseClass} bg-green-100 text-green-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  };

  const handleSortChange = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
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

      {/* Search and Controls */}
      <div className="card mb-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="契約書名、契約ID、相手方名、タグで検索..."
                className="input pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Filter and Sort Controls */}
          <div className="flex flex-wrap gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                title="リスト表示"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                title="グリッド表示"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('company')}
                className={`p-2 rounded ${viewMode === 'company' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                title="会社別表示"
              >
                <Building2 className="w-4 h-4" />
              </button>
            </div>

            {/* Status Filter */}
            <select
              className="input text-sm"
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

            {/* Category Filter */}
            <select
              className="input text-sm"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">すべてのカテゴリ</option>
              {getUniqueCategories().map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              className="input text-sm"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">すべての優先度</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>

            {/* Tag Filter */}
            <select
              className="input text-sm"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
            >
              <option value="all">すべてのタグ</option>
              {getUniqueTags().map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>

            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <select
                className="input text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="updatedAt">更新日</option>
                <option value="createdAt">作成日</option>
                <option value="title">タイトル</option>
                <option value="company">会社名</option>
                <option value="priority">優先度</option>
                <option value="amount">金額</option>
              </select>
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="p-2 border rounded hover:bg-gray-50"
                title={sortDirection === 'asc' ? '昇順' : '降順'}
              >
                {sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contracts Display */}
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
        <>
          {viewMode === 'company' ? (
            // Company grouped view
            <div className="space-y-6">
              {Object.entries(groupedByCompany()).map(([company, companyContracts]) => (
                <div key={company} className="card">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                    <Building2 className="w-5 h-5 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-900">{company}</h3>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                      {companyContracts.length}件
                    </span>
                  </div>
                  <div className="space-y-3">
                    {companyContracts.map((contract) => (
                      <Link
                        key={contract._id}
                        href={`/contracts/${contract.contractId}`}
                        className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-medium text-gray-900">{contract.title}</h4>
                              <span className={getStatusBadgeClass(contract.status)}>
                                {getStatusIcon(contract.status)}
                                {CONTRACT_STATUS_LABELS[contract.status]}
                              </span>
                              {contract.priority && (
                                <span className={getPriorityBadgeClass(contract.priority)}>
                                  {contract.priority === 'high' ? '高' : contract.priority === 'medium' ? '中' : '低'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>ID: {contract.contractId}</span>
                              {contract.category && <span>{contract.category}</span>}
                              {contract.transactionAmount && (
                                <span>¥{contract.transactionAmount.toLocaleString()}</span>
                              )}
                              <span>{new Date(contract.updatedAt).toLocaleDateString('ja-JP')}</span>
                            </div>
                            {contract.tags && contract.tags.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {contract.tags.map((tag) => (
                                  <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                    <Tag className="w-3 h-3 mr-1" />
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === 'grid' ? (
            // Grid view
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContracts.map((contract) => (
                <Link
                  key={contract._id}
                  href={`/contracts/${contract.contractId}`}
                  className="card hover:shadow-lg transition-shadow block"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{contract.title}</h3>
                      {contract.priority && (
                        <span className={getPriorityBadgeClass(contract.priority)}>
                          {contract.priority === 'high' ? '高' : contract.priority === 'medium' ? '中' : '低'}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <span className={getStatusBadgeClass(contract.status)}>
                        {getStatusIcon(contract.status)}
                        {CONTRACT_STATUS_LABELS[contract.status]}
                      </span>
                      <p className="text-sm text-gray-600">
                        {contract.parties.find(p => p.type === 'client')?.company || '未分類'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(contract.updatedAt).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    {contract.tags && contract.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {contract.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {tag}
                          </span>
                        ))}
                        {contract.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{contract.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            // List view (default)
            <div className="space-y-4">
              {filteredContracts.map((contract) => (
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
                        {contract.priority && (
                          <span className={getPriorityBadgeClass(contract.priority)}>
                            {contract.priority === 'high' ? '高' : contract.priority === 'medium' ? '中' : '低'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span>ID: {contract.contractId}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(contract.createdAt).toLocaleDateString('ja-JP')}
                        </span>
                        {contract.parties.length > 0 && (
                          <span>
                            相手方: {contract.parties.find(p => p.type === 'client')?.company || contract.parties.find(p => p.type === 'client')?.name || '-'}
                          </span>
                        )}
                        {contract.category && <span>カテゴリ: {contract.category}</span>}
                        {contract.transactionAmount && (
                          <span>金額: ¥{contract.transactionAmount.toLocaleString()}</span>
                        )}
                      </div>
                      {contract.tags && contract.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {contract.tags.map((tag) => (
                            <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}