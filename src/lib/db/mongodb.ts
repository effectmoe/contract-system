import { MongoClient, Db, Collection, Filter, UpdateFilter, FindOptions } from 'mongodb';
import { 
  DatabaseCollections, 
  MongoDBConnection, 
  QueryOptions, 
  PaginatedResult,
  DatabaseIndex 
} from '@/types/database';
import { Contract, ContractTemplate, AuditEntry } from '@/types/contract';
import { User, Session, AICacheEntry } from '@/types/database';

import { config } from '../config/env';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB_NAME = 'contract_system';

// Demo mode check
const isDemoMode = config.mongodb.isDemo;

// Global connection cache
let cached: MongoDBConnection = {
  client: null,
  db: null,
};

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  // Demo mode - return mock connection
  if (isDemoMode) {
    console.warn('Running in demo mode - MongoDB operations will not persist');
    return { client: null as any, db: null as any };
  }

  if (cached.client && cached.db) {
    return { client: cached.client, db: cached.db };
  }

  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db(MONGODB_DB_NAME);

  cached.client = client;
  cached.db = db;

  // Create indexes on first connection
  await createIndexes(db);

  return { client, db };
}

async function createIndexes(db: Db): Promise<void> {
  const indexes: DatabaseIndex[] = [
    // Contracts collection indexes
    {
      collection: 'contracts',
      fields: { contractId: 1 },
      options: { unique: true }
    },
    {
      collection: 'contracts',
      fields: { status: 1, createdAt: -1 }
    },
    {
      collection: 'contracts',
      fields: { 'parties.email': 1 }
    },
    {
      collection: 'contracts',
      fields: { 
        title: 'text', 
        description: 'text', 
        content: 'text',
        'searchableFields.fieldValue': 'text'
      }
    },
    {
      collection: 'contracts',
      fields: { transactionDate: 1 }
    },
    // Users collection indexes
    {
      collection: 'users',
      fields: { email: 1 },
      options: { unique: true }
    },
    // Sessions collection indexes
    {
      collection: 'sessions',
      fields: { token: 1 },
      options: { unique: true }
    },
    {
      collection: 'sessions',
      fields: { expiresAt: 1 },
      options: { expireAfterSeconds: 0 }
    },
    // AI cache collection indexes
    {
      collection: 'ai_cache',
      fields: { key: 1 },
      options: { unique: true }
    },
    {
      collection: 'ai_cache',
      fields: { expiresAt: 1 },
      options: { expireAfterSeconds: 0 }
    },
    // Audit logs collection indexes
    {
      collection: 'audit_logs',
      fields: { contractId: 1, performedAt: -1 }
    }
  ];

  for (const index of indexes) {
    const collection = db.collection(index.collection);
    await collection.createIndex(index.fields, index.options || {});
  }
}

// Generic CRUD operations
export class DatabaseService<T> {
  private collection: Collection<T>;

  constructor(private db: Db, private collectionName: string) {
    this.collection = db.collection<T>(collectionName);
  }

  async findOne(filter: Filter<T>): Promise<T | null> {
    return await this.collection.findOne(filter);
  }

  async findMany(
    filter: Filter<T>,
    options?: QueryOptions
  ): Promise<PaginatedResult<T>> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const findOptions: FindOptions = {
      skip,
      limit,
      sort: options?.sort,
      projection: options?.projection,
    };

    const [data, total] = await Promise.all([
      this.collection.find(filter, findOptions).toArray(),
      this.collection.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async create(document: T): Promise<T> {
    const result = await this.collection.insertOne(document as any);
    return { ...document, _id: result.insertedId } as T;
  }

  async update(
    filter: Filter<T>,
    update: UpdateFilter<T>
  ): Promise<boolean> {
    const result = await this.collection.updateOne(filter, update);
    return result.modifiedCount > 0;
  }

  async delete(filter: Filter<T>): Promise<boolean> {
    const result = await this.collection.deleteOne(filter);
    return result.deletedCount > 0;
  }

  async aggregate<R>(pipeline: any[]): Promise<R[]> {
    return await this.collection.aggregate<R>(pipeline).toArray();
  }
}

// Contract-specific operations
export class ContractService {
  private db: Db;
  private contracts: DatabaseService<Contract>;
  private auditLogs: DatabaseService<AuditEntry>;

  constructor(db: Db) {
    this.db = db;
    this.contracts = new DatabaseService<Contract>(db, 'contracts');
    this.auditLogs = new DatabaseService<AuditEntry>(db, 'audit_logs');
  }

  async searchContracts(
    searchText: string,
    filters?: Partial<Contract>
  ): Promise<PaginatedResult<Contract>> {
    const searchFilter: Filter<Contract> = {
      $and: [
        {
          $or: [
            { $text: { $search: searchText } },
            { contractId: { $regex: searchText, $options: 'i' } },
            { 'parties.name': { $regex: searchText, $options: 'i' } },
            { 'parties.email': { $regex: searchText, $options: 'i' } },
          ],
        },
        ...(filters ? [filters] : []),
      ],
    };

    return await this.contracts.findMany(searchFilter, {
      sort: { score: { $meta: 'textScore' }, createdAt: -1 },
    });
  }

  async createContract(contract: Contract, userId: string): Promise<Contract> {
    const newContract = await this.contracts.create(contract);
    
    // Create audit log
    await this.auditLogs.create({
      id: generateId(),
      action: 'created',
      performedBy: userId,
      performedAt: new Date(),
      details: { contractId: newContract.contractId },
    } as AuditEntry);

    return newContract;
  }

  async updateContractStatus(
    contractId: string,
    status: Contract['status'],
    userId: string
  ): Promise<boolean> {
    const result = await this.contracts.update(
      { contractId },
      { 
        $set: { 
          status, 
          updatedAt: new Date(),
          ...(status === 'completed' ? { completedAt: new Date() } : {})
        } 
      }
    );

    if (result) {
      await this.auditLogs.create({
        id: generateId(),
        action: 'updated',
        performedBy: userId,
        performedAt: new Date(),
        details: { contractId, status },
      } as AuditEntry);
    }

    return result;
  }

  async getContractAnalytics(): Promise<any> {
    const pipeline = [
      {
        $facet: {
          statusCounts: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ],
          typeCounts: [
            { $group: { _id: '$type', count: { $sum: 1 } } },
          ],
          monthlyTrends: [
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' },
                },
                created: { $sum: 1 },
                completed: {
                  $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                },
              },
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 },
          ],
          averageCompletionTime: [
            {
              $match: {
                status: 'completed',
                completedAt: { $exists: true },
              },
            },
            {
              $project: {
                completionTime: {
                  $subtract: ['$completedAt', '$createdAt'],
                },
              },
            },
            {
              $group: {
                _id: null,
                avgTime: { $avg: '$completionTime' },
              },
            },
          ],
        },
      },
    ];

    const results = await this.contracts.aggregate(pipeline);
    return results[0];
  }
}

// Helper function to generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Export database services
export async function getContractService(): Promise<ContractService> {
  const { db } = await connectToDatabase();
  return new ContractService(db);
}

export async function getDatabaseService<T>(
  collectionName: string
): Promise<DatabaseService<T>> {
  const { db } = await connectToDatabase();
  return new DatabaseService<T>(db, collectionName);
}