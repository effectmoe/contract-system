import { Contract } from '@/types/contract';
import { PaginatedResult } from '@/types/database';

export interface ContractFilter {
  query?: string;
  status?: string[];
  type?: string[];
  category?: string;
  priority?: string;
  tags?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface ContractSort {
  field: keyof Contract;
  direction: 'asc' | 'desc';
}

export interface ContractRepository {
  // Basic CRUD operations
  findById(contractId: string): Promise<Contract | null>;
  findAll(): Promise<Contract[]>;
  create(contract: Contract): Promise<Contract>;
  update(contractId: string, updates: Partial<Contract>): Promise<Contract | null>;
  delete(contractId: string): Promise<boolean>;

  // Search and filtering
  search(filter: ContractFilter): Promise<Contract[]>;
  findPaginated(params: {
    page: number;
    limit: number;
    filter?: ContractFilter;
    sort?: ContractSort;
  }): Promise<PaginatedResult<Contract>>;

  // Utility methods
  exists(contractId: string): Promise<boolean>;
  count(filter?: ContractFilter): Promise<number>;
  
  // Batch operations
  createMany(contracts: Contract[]): Promise<Contract[]>;
  updateMany(updates: Array<{ contractId: string; data: Partial<Contract> }>): Promise<boolean>;
  deleteMany(contractIds: string[]): Promise<number>;
}

export interface RepositoryFactory {
  createContractRepository(): ContractRepository;
}