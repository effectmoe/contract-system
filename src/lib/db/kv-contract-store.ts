import { kv } from '@vercel/kv';
import { Contract } from '@/types/contract';
import { config } from '@/lib/config/env';

export class KVContractStore {
  private prefix = 'contract:';
  private indexKey = 'contract:index';

  async getAll(): Promise<Contract[]> {
    if (config.kv.isDemo) {
      throw new Error('KV is not configured');
    }

    try {
      // Get all contract IDs from index
      const contractIds = await kv.smembers(this.indexKey) as string[];
      
      if (contractIds.length === 0) {
        return [];
      }

      // Get all contracts in parallel
      const contracts = await Promise.all(
        contractIds.map(id => kv.get<Contract>(`${this.prefix}${id}`))
      );

      return contracts.filter(Boolean) as Contract[];
    } catch (error) {
      console.error('Failed to get all contracts from KV:', error);
      return [];
    }
  }

  async get(contractId: string): Promise<Contract | null> {
    if (config.kv.isDemo) {
      throw new Error('KV is not configured');
    }

    try {
      const contract = await kv.get<Contract>(`${this.prefix}${contractId}`);
      return contract;
    } catch (error) {
      console.error('Failed to get contract from KV:', error);
      return null;
    }
  }

  async create(contract: Contract): Promise<Contract> {
    if (config.kv.isDemo) {
      throw new Error('KV is not configured');
    }

    try {
      // Save contract
      await kv.set(`${this.prefix}${contract.contractId}`, contract);
      
      // Add to index
      await kv.sadd(this.indexKey, contract.contractId);
      
      return contract;
    } catch (error) {
      console.error('Failed to create contract in KV:', error);
      throw error;
    }
  }

  async update(contractId: string, updates: Partial<Contract>): Promise<Contract | null> {
    if (config.kv.isDemo) {
      throw new Error('KV is not configured');
    }

    try {
      const existing = await this.get(contractId);
      if (!existing) {
        return null;
      }

      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date()
      };

      await kv.set(`${this.prefix}${contractId}`, updated);
      return updated;
    } catch (error) {
      console.error('Failed to update contract in KV:', error);
      throw error;
    }
  }

  async delete(contractId: string): Promise<boolean> {
    if (config.kv.isDemo) {
      throw new Error('KV is not configured');
    }

    try {
      // Remove from index
      await kv.srem(this.indexKey, contractId);
      
      // Delete contract
      const deleted = await kv.del(`${this.prefix}${contractId}`);
      
      return deleted === 1;
    } catch (error) {
      console.error('Failed to delete contract from KV:', error);
      return false;
    }
  }

  async search(params: {
    query?: string;
    status?: string[];
    type?: string[];
  }): Promise<Contract[]> {
    // For now, we'll get all and filter in memory
    // In production, you might want to maintain separate indexes for status/type
    const allContracts = await this.getAll();
    
    let results = allContracts;

    // Filter by status
    if (params.status && params.status.length > 0) {
      results = results.filter(contract => 
        params.status!.includes(contract.status)
      );
    }

    // Filter by type
    if (params.type && params.type.length > 0) {
      results = results.filter(contract => 
        params.type!.includes(contract.type)
      );
    }

    // Search by query
    if (params.query) {
      const query = params.query.toLowerCase();
      results = results.filter(contract => 
        contract.title.toLowerCase().includes(query) ||
        contract.description?.toLowerCase().includes(query) ||
        contract.contractId.toLowerCase().includes(query)
      );
    }

    return results;
  }

  async getPaginated(params: {
    page: number;
    limit: number;
    filter?: any;
    sort?: any;
  }): Promise<{
    data: Contract[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const allContracts = await this.search(params.filter || {});
    const total = allContracts.length;
    const totalPages = Math.ceil(total / params.limit);
    const start = (params.page - 1) * params.limit;
    const end = start + params.limit;

    // Sort contracts
    if (params.sort) {
      const sortField = Object.keys(params.sort)[0] as keyof Contract;
      const sortOrder = params.sort[sortField];
      
      allContracts.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (aValue === undefined || bValue === undefined) return 0;
        
        if (sortOrder === 1) {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    return {
      data: allContracts.slice(start, end),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages,
        hasNext: params.page < totalPages,
        hasPrev: params.page > 1,
      },
    };
  }

  // Initialize with demo data if empty
  async initializeIfEmpty(demoData: Contract[]): Promise<void> {
    if (config.kv.isDemo) {
      return;
    }

    try {
      const existing = await this.getAll();
      if (existing.length === 0) {
        // デモデータの自動初期化を無効化
        console.log('KV store is empty. No demo data will be initialized.');
        // for (const contract of demoData) {
        //   await this.create(contract);
        // }
      }
    } catch (error) {
      console.error('Failed to initialize KV store:', error);
    }
  }
}

export const kvContractStore = new KVContractStore();