'use client';

import { Search, Filter, SortAsc, SortDesc, X } from 'lucide-react';
import { Contract, ContractStatus } from '@/types/contract';
import { CONTRACT_STATUS_LABELS } from '@/lib/utils/constants';
import { FilterState, SortOption, SortDirection } from '@/hooks/useContractFilters';

interface ContractFiltersProps {
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onResetFilters: () => void;
  contracts: Contract[];
  filterSummary: string[];
}

export default function ContractFilters({
  filters,
  onFilterChange,
  onResetFilters,
  contracts,
  filterSummary,
}: ContractFiltersProps) {
  // Extract unique values for filter options
  const uniqueCategories = Array.from(
    new Set(contracts.map(c => c.category).filter(Boolean))
  );
  
  const uniquePriorities = Array.from(
    new Set(contracts.map(c => c.priority).filter(Boolean))
  );
  
  const uniqueTags = Array.from(
    new Set(contracts.flatMap(c => c.tags || []))
  );

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'updatedAt', label: '更新日時' },
    { value: 'createdAt', label: '作成日時' },
    { value: 'title', label: 'タイトル' },
    { value: 'company', label: '会社名' },
    { value: 'priority', label: '優先度' },
    { value: 'amount', label: '金額' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          フィルタ・検索
        </h3>
        {filterSummary.length > 0 && (
          <button
            onClick={onResetFilters}
            className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            フィルタをクリア
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="契約書名、ID、会社名で検索..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange('searchQuery', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Filter Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ステータス
          </label>
          <select
            value={filters.statusFilter}
            onChange={(e) => onFilterChange('statusFilter', e.target.value as ContractStatus | 'all')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">すべて</option>
            {Object.entries(CONTRACT_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            カテゴリ
          </label>
          <select
            value={filters.categoryFilter}
            onChange={(e) => onFilterChange('categoryFilter', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">すべて</option>
            {uniqueCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            優先度
          </label>
          <select
            value={filters.priorityFilter}
            onChange={(e) => onFilterChange('priorityFilter', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">すべて</option>
            {uniquePriorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority === 'high' ? '高' : priority === 'medium' ? '中' : '低'}
              </option>
            ))}
          </select>
        </div>

        {/* Tag Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            タグ
          </label>
          <select
            value={filters.tagFilter}
            onChange={(e) => onFilterChange('tagFilter', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">すべて</option>
            {uniqueTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            並び順
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange('sortBy', e.target.value as SortOption)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            方向
          </label>
          <button
            onClick={() => onFilterChange('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center gap-2"
          >
            {filters.sortDirection === 'asc' ? (
              <>
                <SortAsc className="w-4 h-4" />
                昇順
              </>
            ) : (
              <>
                <SortDesc className="w-4 h-4" />
                降順
              </>
            )}
          </button>
        </div>
      </div>

      {/* Active Filters Summary */}
      {filterSummary.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">適用中のフィルタ:</p>
          <div className="flex flex-wrap gap-2">
            {filterSummary.map((summary, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {summary}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}