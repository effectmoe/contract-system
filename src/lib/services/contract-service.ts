import { Contract, ContractStatus } from '@/types/contract';
import { PaginatedResult } from '@/types/database';
import { 
  ContractRepository, 
  ContractFilter, 
  ContractSort,
  getContractRepository 
} from '@/lib/repositories';

export interface ContractSearchParams {
  query?: string;
  status?: ContractStatus[];
  type?: string[];
  category?: string;
  priority?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: keyof Contract;
  sortOrder?: 'asc' | 'desc';
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface ContractStats {
  total: number;
  draft: number;
  pending_signature: number;
  completed: number;
  expiring_soon: number;
  completedCount: number;
  totalRevenue: number;
}

export class ContractService {
  private repository: ContractRepository;

  constructor(repository?: ContractRepository) {
    this.repository = repository || getContractRepository();
  }

  // Basic CRUD operations
  async getContract(contractId: string): Promise<Contract | null> {
    return await this.repository.findById(contractId);
  }

  async getAllContracts(): Promise<Contract[]> {
    return await this.repository.findAll();
  }

  async createContract(contract: Contract): Promise<Contract> {
    // Add business logic validation
    this.validateContract(contract);
    
    // Ensure timestamps
    const now = new Date();
    const contractWithTimestamps = {
      ...contract,
      createdAt: contract.createdAt || now,
      updatedAt: now,
    };

    return await this.repository.create(contractWithTimestamps);
  }

  async updateContract(contractId: string, updates: Partial<Contract>): Promise<Contract | null> {
    // Add business logic validation
    if (updates.status) {
      this.validateStatusTransition(contractId, updates.status);
    }

    const updatedContract = await this.repository.update(contractId, {
      ...updates,
      updatedAt: new Date(),
    });

    // Handle status-specific logic
    if (updatedContract && updates.status === 'completed') {
      await this.handleContractCompletion(updatedContract);
    }

    return updatedContract;
  }

  async deleteContract(contractId: string): Promise<boolean> {
    // Check if deletion is allowed
    const contract = await this.repository.findById(contractId);
    if (!contract) {
      return false;
    }

    if (contract.status === 'completed') {
      throw new Error('Cannot delete completed contracts');
    }

    return await this.repository.delete(contractId);
  }

  // Search and filtering
  async searchContracts(params: ContractSearchParams): Promise<PaginatedResult<Contract>> {
    const filter: ContractFilter = {
      query: params.query,
      status: params.status,
      type: params.type,
      category: params.category,
      priority: params.priority,
      tags: params.tags,
      dateRange: params.dateRange,
    };

    const sort: ContractSort | undefined = params.sortBy ? {
      field: params.sortBy,
      direction: params.sortOrder || 'desc',
    } : undefined;

    return await this.repository.findPaginated({
      page: params.page || 1,
      limit: params.limit || 20,
      filter,
      sort,
    });
  }

  // Analytics and statistics
  async getContractStats(): Promise<ContractStats> {
    const contracts = await this.repository.findAll();
    
    const stats: ContractStats = {
      total: contracts.length,
      draft: 0,
      pending_signature: 0,
      completed: 0,
      expiring_soon: 0,
      completedCount: 0,
      totalRevenue: 0,
    };

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (const contract of contracts) {
      // Status counts
      if (contract.status === 'draft') stats.draft++;
      if (contract.status === 'pending_signature') stats.pending_signature++;
      if (contract.status === 'completed') {
        stats.completed++;
        stats.completedCount++;
        stats.totalRevenue += contract.transactionAmount || 0;
      }

      // Expiring soon check
      if (contract.signatureExpiresAt) {
        const expiryDate = new Date(contract.signatureExpiresAt);
        if (expiryDate > now && expiryDate <= sevenDaysFromNow) {
          stats.expiring_soon++;
        }
      }
    }

    return stats;
  }

  async getRecentCompletedContracts(limit: number = 10): Promise<Contract[]> {
    const filter: ContractFilter = {
      status: ['completed'],
    };

    const result = await this.repository.findPaginated({
      page: 1,
      limit,
      filter,
      sort: {
        field: 'completedAt',
        direction: 'desc',
      },
    });

    return result.data;
  }

  // Contract status management
  async updateContractStatus(contractId: string, status: ContractStatus): Promise<Contract | null> {
    const updates: Partial<Contract> = { status };
    
    if (status === 'completed') {
      updates.completedAt = new Date();
    }

    return await this.updateContract(contractId, updates);
  }

  // Bulk operations
  async createMultipleContracts(contracts: Contract[]): Promise<Contract[]> {
    const validatedContracts = contracts.map(contract => {
      this.validateContract(contract);
      const now = new Date();
      return {
        ...contract,
        createdAt: contract.createdAt || now,
        updatedAt: now,
      };
    });

    return await this.repository.createMany(validatedContracts);
  }

  async deleteMultipleContracts(contractIds: string[]): Promise<number> {
    // Check if all contracts can be deleted
    for (const contractId of contractIds) {
      const contract = await this.repository.findById(contractId);
      if (contract && contract.status === 'completed') {
        throw new Error(`Cannot delete completed contract: ${contractId}`);
      }
    }

    return await this.repository.deleteMany(contractIds);
  }

  // Validation and business logic
  private validateContract(contract: Contract): void {
    if (!contract.title?.trim()) {
      throw new Error('Contract title is required');
    }

    if (!contract.parties || contract.parties.length === 0) {
      throw new Error('Contract must have at least one party');
    }

    if (contract.transactionAmount && contract.transactionAmount < 0) {
      throw new Error('Transaction amount cannot be negative');
    }

    // Validate parties
    for (const party of contract.parties) {
      if (!party.name?.trim()) {
        throw new Error('Party name is required');
      }
      if (!party.email?.trim()) {
        throw new Error('Party email is required');
      }
      if (!this.isValidEmail(party.email)) {
        throw new Error(`Invalid email format: ${party.email}`);
      }
    }
  }

  private async validateStatusTransition(contractId: string, newStatus: ContractStatus): Promise<void> {
    const contract = await this.repository.findById(contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }

    const currentStatus = contract.status;
    const validTransitions: Record<ContractStatus, ContractStatus[]> = {
      draft: ['pending_review', 'pending_signature', 'cancelled'],
      pending_review: ['pending_signature', 'draft', 'cancelled'],
      pending_signature: ['partially_signed', 'completed', 'cancelled', 'expired'],
      partially_signed: ['completed', 'cancelled'],
      completed: [], // Cannot transition from completed
      cancelled: ['draft'], // Can only go back to draft
      expired: ['draft', 'cancelled'],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  private async handleContractCompletion(contract: Contract): Promise<void> {
    // Business logic for completed contracts
    console.log(`Contract ${contract.contractId} completed successfully`);
    
    // Here you could add:
    // - Send notification emails
    // - Generate certificates
    // - Update accounting systems
    // - Trigger workflows
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Utility methods
  async contractExists(contractId: string): Promise<boolean> {
    return await this.repository.exists(contractId);
  }

  async getContractCount(filter?: ContractFilter): Promise<number> {
    return await this.repository.count(filter);
  }
}

// Singleton pattern
let contractServiceInstance: ContractService | null = null;

export function getContractService(): ContractService {
  if (!contractServiceInstance) {
    contractServiceInstance = new ContractService();
  }
  return contractServiceInstance;
}