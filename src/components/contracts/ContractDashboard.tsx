'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Database, Grid, List } from 'lucide-react';
import { Contract } from '@/types/contract';
import { useContractFilters } from '@/hooks/useContractFilters';
import ContractStats from './ContractStats';
import ContractFilters from './ContractFilters';
import ContractList from './ContractList';
import { getContractService } from '@/lib/services/contract-service';

type ViewMode = 'list' | 'grid';

export default function ContractDashboard() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    pending_signature: 0,
    completed: 0,
    expiring_soon: 0,
  });
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(true);
  const [creatingDemoData, setCreatingDemoData] = useState(false);

  const {
    filters,
    filteredAndSortedContracts,
    updateFilter,
    resetFilters,
    getFilterSummary,
  } = useContractFilters(contracts);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const contractService = getContractService();
      
      // Fetch contracts and stats in parallel
      const [contractsResult, statsResult] = await Promise.all([
        contractService.getAllContracts(),
        contractService.getContractStats(),
      ]);

      setContracts(contractsResult);
      setStats(statsResult);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
      // Handle error state here
    } finally {
      setLoading(false);
    }
  };

  const createDemoData = async () => {
    try {
      setCreatingDemoData(true);
      
      // Create demo contracts
      const demoContracts: Partial<Contract>[] = [
        {
          title: 'システム開発契約書',
          description: 'WEBシステム開発に関する業務委託契約',
          type: 'service_agreement',
          category: 'IT',
          priority: 'high',
          parties: [{
            id: 'party-1',  
            type: 'client',
            name: '田中太郎',
            email: 'tanaka@example.com',
            company: '株式会社Example',
            role: 'client',
            signatureRequired: true,
          }],
          transactionAmount: 1500000,
          tags: ['開発', 'WEB', '業務委託'],
          content: 'システム開発に関する契約内容...',
        },
        {
          title: 'デザイン制作契約書',
          description: 'ロゴデザイン制作契約',
          type: 'design_agreement',
          category: 'デザイン',
          priority: 'medium',
          parties: [{
            id: 'party-2',
            type: 'client',
            name: '佐藤花子',
            email: 'sato@design.com',
            company: 'デザイン株式会社',
            role: 'client',
            signatureRequired: true,
          }],
          transactionAmount: 300000,
          tags: ['デザイン', 'ロゴ'],
          content: 'ロゴデザイン制作に関する契約内容...',
        },
      ];

      const contractService = getContractService();
      
      for (const contractData of demoContracts) {
        const contractId = `CNT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const fullContract: Contract = {
          contractId,
          title: contractData.title!,
          description: contractData.description || '',
          content: contractData.content!,
          parties: contractData.parties || [],
          status: 'draft',
          type: contractData.type!,
          category: contractData.category,
          priority: contractData.priority,
          signatures: [],
          attachments: [],
          retentionPeriod: 7,
          searchableFields: [],
          auditLog: [],
          transactionAmount: contractData.transactionAmount,
          tags: contractData.tags,
          createdBy: 'demo',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await contractService.createContract(fullContract);
      }

      // Refresh data
      await fetchContracts();
    } catch (error) {
      console.error('Failed to create demo data:', error);
    } finally {
      setCreatingDemoData(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                契約書管理システム
              </h1>
              <p className="mt-2 text-gray-600">
                契約書の作成・管理・分析を一元化
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Create Demo Data Button (show only when no contracts) */}
              {contracts.length === 0 && !loading && (
                <button
                  onClick={createDemoData}
                  disabled={creatingDemoData}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Database className="w-4 h-4 mr-2" />
                  {creatingDemoData ? 'データ作成中...' : 'デモデータ作成'}
                </button>
              )}

              {/* View Mode Toggle */}
              <div className="flex items-center bg-white rounded-lg border">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-l-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-r-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>

              {/* New Contract Button */}
              <Link
                href="/contracts/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                新規作成
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <ContractStats 
          stats={stats} 
          loading={loading}
          onStatClick={(statusFilter) => {
            // Reset filters first
            resetFilters();
            
            // Apply new filter based on clicked stat
            if (statusFilter === 'all') {
              // No filter needed for all contracts
            } else if (statusFilter === 'expiring_soon') {
              // Set a date range filter for contracts expiring within 7 days
              const now = new Date();
              const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
              updateFilter('dateRange', {
                field: 'signatureExpiresAt',
                from: now,
                to: sevenDaysFromNow,
              });
            } else {
              // Filter by status
              updateFilter('status', statusFilter);
            }
          }}
        />

        {/* Filters */}
        <ContractFilters
          filters={filters}
          onFilterChange={updateFilter}
          onResetFilters={resetFilters}
          contracts={contracts}
          filterSummary={getFilterSummary()}
        />

        {/* Contract List */}
        <ContractList
          contracts={filteredAndSortedContracts}
          loading={loading}
        />
      </div>
    </div>
  );
}