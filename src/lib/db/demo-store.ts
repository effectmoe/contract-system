import { Contract } from '@/types/contract';
import { demoContracts } from './demo-data';

// In-memory storage for demo mode
class DemoContractStore {
  private contracts: Map<string, Contract>;
  private initialized: boolean = false;

  constructor() {
    this.contracts = new Map();
  }

  private initialize() {
    if (!this.initialized) {
      // 初期化時はデモデータを読み込まない（本番モードではMongoDBを使用）
      this.initialized = true;
    }
  }

  getAll(): Contract[] {
    this.initialize();
    return Array.from(this.contracts.values());
  }

  get(contractId: string): Contract | undefined {
    this.initialize();
    return this.contracts.get(contractId);
  }

  create(contract: Contract): Contract {
    this.initialize();
    this.contracts.set(contract.contractId, contract);
    return contract;
  }

  update(contractId: string, updates: Partial<Contract>): Contract | undefined {
    this.initialize();
    const existing = this.contracts.get(contractId);
    if (!existing) return undefined;

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    this.contracts.set(contractId, updated);
    return updated;
  }

  delete(contractId: string): boolean {
    this.initialize();
    return this.contracts.delete(contractId);
  }

  search(params: {
    query?: string;
    status?: string[];
    type?: string[];
  }): Contract[] {
    this.initialize();
    let results = this.getAll();

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

  // Get paginated results
  getPaginated(params: {
    page: number;
    limit: number;
    filter?: any;
    sort?: any;
  }): {
    data: Contract[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  } {
    const allContracts = this.search(params.filter || {});
    const total = allContracts.length;
    const totalPages = Math.ceil(total / params.limit);
    const start = (params.page - 1) * params.limit;
    const end = start + params.limit;

    // Sort contracts
    if (params.sort) {
      const sortField = Object.keys(params.sort)[0];
      const sortOrder = params.sort[sortField];
      allContracts.sort((a: any, b: any) => {
        if (sortOrder === 1) {
          return a[sortField] > b[sortField] ? 1 : -1;
        } else {
          return a[sortField] < b[sortField] ? 1 : -1;
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
}

// Export singleton instance
export const demoContractStore = new DemoContractStore();