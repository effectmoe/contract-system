import { Contract } from '@/types/contract';
import { ContractRepository, ContractFilter, ContractSort } from './interfaces';
import { PaginatedResult } from '@/types/database';
import { demoContractStore } from '@/lib/db/demo-store';

export class DemoContractRepository implements ContractRepository {
  async findById(contractId: string): Promise<Contract | null> {
    const contract = demoContractStore.get(contractId);
    return contract || null;
  }

  async findAll(): Promise<Contract[]> {
    return demoContractStore.getAll();
  }

  async create(contract: Contract): Promise<Contract> {
    return demoContractStore.create(contract);
  }

  async update(contractId: string, updates: Partial<Contract>): Promise<Contract | null> {
    const updated = demoContractStore.update(contractId, updates);
    return updated || null;
  }

  async delete(contractId: string): Promise<boolean> {
    return demoContractStore.delete(contractId);
  }

  async search(filter: ContractFilter): Promise<Contract[]> {
    return demoContractStore.search({
      query: filter.query,
      status: filter.status,
      type: filter.type,
    });
  }

  async findPaginated(params: {
    page: number;
    limit: number;
    filter?: ContractFilter;
    sort?: ContractSort;
  }): Promise<PaginatedResult<Contract>> {
    const sortParam = params.sort ? {
      [params.sort.field]: params.sort.direction === 'desc' ? -1 : 1
    } : undefined;

    return demoContractStore.getPaginated({
      page: params.page,
      limit: params.limit,
      filter: params.filter,
      sort: sortParam,
    });
  }

  async exists(contractId: string): Promise<boolean> {
    const contract = await this.findById(contractId);
    return contract !== null;
  }

  async count(filter?: ContractFilter): Promise<number> {
    if (!filter) {
      const all = await this.findAll();
      return all.length;
    }
    const filtered = await this.search(filter);
    return filtered.length;
  }

  async createMany(contracts: Contract[]): Promise<Contract[]> {
    const created: Contract[] = [];
    for (const contract of contracts) {
      created.push(await this.create(contract));
    }
    return created;
  }

  async updateMany(updates: Array<{ contractId: string; data: Partial<Contract> }>): Promise<boolean> {
    let allSuccess = true;
    for (const update of updates) {
      const result = await this.update(update.contractId, update.data);
      if (!result) {
        allSuccess = false;
      }
    }
    return allSuccess;
  }

  async deleteMany(contractIds: string[]): Promise<number> {
    let deletedCount = 0;
    for (const contractId of contractIds) {
      const deleted = await this.delete(contractId);
      if (deleted) {
        deletedCount++;
      }
    }
    return deletedCount;
  }
}