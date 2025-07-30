import { Contract } from '@/types/contract';
import { ContractRepository, ContractFilter, ContractSort, PaginatedResult } from './interfaces';

// Dynamic import to avoid client-side bundle issues
const getMongoConnection = async () => {
  const { connectToDatabase } = await import('@/lib/db/mongodb');
  return connectToDatabase();
};

export class MongoDBContractRepository implements ContractRepository {
  private async getCollection() {
    const { db } = await getMongoConnection();
    return db.collection<Contract>('contracts');
  }

  async findById(contractId: string): Promise<Contract | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ contractId });
  }

  async findAll(): Promise<Contract[]> {
    const collection = await this.getCollection();
    return await collection.find({}).toArray();
  }

  async create(contract: Contract): Promise<Contract> {
    const collection = await this.getCollection();
    const result = await collection.insertOne(contract);
    return { ...contract, _id: result.insertedId };
  }

  async update(contractId: string, updates: Partial<Contract>): Promise<Contract | null> {
    const collection = await this.getCollection();
    
    const updateDoc = {
      $set: {
        ...updates,
        updatedAt: new Date()
      }
    };
    
    const result = await collection.findOneAndUpdate(
      { contractId },
      updateDoc,
      { returnDocument: 'after' }
    );
    
    return result || null;
  }

  async delete(contractId: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ contractId });
    return result.deletedCount > 0;
  }

  async search(filter: ContractFilter): Promise<Contract[]> {
    const collection = await this.getCollection();
    const mongoFilter = this.buildMongoFilter(filter);
    return await collection.find(mongoFilter).toArray();
  }

  async findPaginated(params: {
    page: number;
    limit: number;
    filter?: ContractFilter;
    sort?: ContractSort;
  }): Promise<PaginatedResult<Contract>> {
    const collection = await this.getCollection();
    const mongoFilter = this.buildMongoFilter(params.filter || {});
    const skip = (params.page - 1) * params.limit;
    
    const sortOption: any = params.sort ? {
      [params.sort.field as string]: params.sort.direction === 'desc' ? -1 : 1
    } : { updatedAt: -1 };

    const [data, total] = await Promise.all([
      collection.find(mongoFilter)
        .sort(sortOption)
        .skip(skip)
        .limit(params.limit)
        .toArray(),
      collection.countDocuments(mongoFilter)
    ]);

    const totalPages = Math.ceil(total / params.limit);

    return {
      data,
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

  async exists(contractId: string): Promise<boolean> {
    const collection = await this.getCollection();
    const count = await collection.countDocuments({ contractId });
    return count > 0;
  }

  async count(filter?: ContractFilter): Promise<number> {
    const collection = await this.getCollection();
    const mongoFilter = this.buildMongoFilter(filter || {});
    return await collection.countDocuments(mongoFilter);
  }

  async createMany(contracts: Contract[]): Promise<Contract[]> {
    const collection = await this.getCollection();
    const result = await collection.insertMany(contracts);
    return contracts.map((contract, index) => ({
      ...contract,
      _id: result.insertedIds[index]
    }));
  }

  async updateMany(updates: Array<{ contractId: string; data: Partial<Contract> }>): Promise<boolean> {
    const collection = await this.getCollection();
    const operations = updates.map(update => ({
      updateOne: {
        filter: { contractId: update.contractId },
        update: { 
          $set: { 
            ...update.data, 
            updatedAt: new Date() 
          } 
        }
      }
    }));
    
    const result = await collection.bulkWrite(operations);
    return result.modifiedCount === updates.length;
  }

  async deleteMany(contractIds: string[]): Promise<number> {
    const collection = await this.getCollection();
    const result = await collection.deleteMany({
      contractId: { $in: contractIds }
    });
    return result.deletedCount;
  }

  private buildMongoFilter(filter: ContractFilter): any {
    const mongoFilter: any = {};

    if (filter.query) {
      mongoFilter.$or = [
        { title: { $regex: filter.query, $options: 'i' } },
        { description: { $regex: filter.query, $options: 'i' } },
        { contractId: { $regex: filter.query, $options: 'i' } },
        { 'parties.name': { $regex: filter.query, $options: 'i' } },
        { 'parties.email': { $regex: filter.query, $options: 'i' } }
      ];
    }

    if (filter.status && filter.status.length > 0) {
      mongoFilter.status = { $in: filter.status as any[] };
    }

    if (filter.type && filter.type.length > 0) {
      mongoFilter.type = { $in: filter.type };
    }

    if (filter.category) {
      mongoFilter.category = filter.category;
    }

    if (filter.priority) {
      mongoFilter.priority = filter.priority;
    }

    if (filter.tags && filter.tags.length > 0) {
      mongoFilter.tags = { $in: filter.tags };
    }

    if (filter.dateRange) {
      mongoFilter.createdAt = {
        $gte: filter.dateRange.from,
        $lte: filter.dateRange.to
      };
    }

    return mongoFilter;
  }
}