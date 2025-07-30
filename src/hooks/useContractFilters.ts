import { useState, useMemo } from 'react';
import { Contract, ContractStatus } from '@/types/contract';

export type SortOption = 'createdAt' | 'updatedAt' | 'title' | 'company' | 'priority' | 'amount';
export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  searchQuery: string;
  statusFilter: ContractStatus | 'all';
  categoryFilter: string;
  priorityFilter: string;
  tagFilter: string;
  sortBy: SortOption;
  sortDirection: SortDirection;
}

export function useContractFilters(contracts: Contract[]) {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    statusFilter: 'all',
    categoryFilter: 'all',
    priorityFilter: 'all',
    tagFilter: 'all',
    sortBy: 'updatedAt',
    sortDirection: 'desc',
  });

  const filteredAndSortedContracts = useMemo(() => {
    let filtered = [...contracts];

    // Search query filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(contract =>
        contract.title.toLowerCase().includes(query) ||
        contract.description?.toLowerCase().includes(query) ||
        contract.contractId.toLowerCase().includes(query) ||
        contract.parties.some(party => 
          party.name.toLowerCase().includes(query) ||
          party.email.toLowerCase().includes(query) ||
          party.company?.toLowerCase().includes(query)
        )
      );
    }

    // Status filter
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter(contract => contract.status === filters.statusFilter);
    }

    // Category filter
    if (filters.categoryFilter !== 'all') {
      filtered = filtered.filter(contract => contract.category === filters.categoryFilter);
    }

    // Priority filter
    if (filters.priorityFilter !== 'all') {
      filtered = filtered.filter(contract => contract.priority === filters.priorityFilter);
    }

    // Tag filter
    if (filters.tagFilter !== 'all') {
      filtered = filtered.filter(contract => 
        contract.tags?.includes(filters.tagFilter)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (filters.sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'company':
          aValue = a.parties.find(p => p.type === 'client')?.company?.toLowerCase() || '';
          bValue = b.parties.find(p => p.type === 'client')?.company?.toLowerCase() || '';
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

      if (aValue < bValue) return filters.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [contracts, filters]);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      statusFilter: 'all',
      categoryFilter: 'all',
      priorityFilter: 'all',  
      tagFilter: 'all',
      sortBy: 'updatedAt',
      sortDirection: 'desc',
    });
  };

  const getFilterSummary = () => {
    const activeFilters: string[] = [];
    
    if (filters.searchQuery.trim()) {
      activeFilters.push(`検索: "${filters.searchQuery}"`);
    }
    if (filters.statusFilter !== 'all') {
      activeFilters.push(`ステータス: ${filters.statusFilter}`);
    }
    if (filters.categoryFilter !== 'all') {
      activeFilters.push(`カテゴリ: ${filters.categoryFilter}`);
    }
    if (filters.priorityFilter !== 'all') {
      activeFilters.push(`優先度: ${filters.priorityFilter}`);
    }
    if (filters.tagFilter !== 'all') {
      activeFilters.push(`タグ: ${filters.tagFilter}`);
    }

    return activeFilters;
  };

  return {
    filters,
    filteredAndSortedContracts,
    updateFilter,
    resetFilters,
    getFilterSummary,
  };
}