import { ContractRepository, RepositoryFactory } from './interfaces';
import { DemoContractRepository } from './demo-contract-repository';
import { KVContractRepository } from './kv-contract-repository';
import { config } from '@/lib/config/env';

export class DefaultRepositoryFactory implements RepositoryFactory {
  createContractRepository(): ContractRepository {
    // Priority: MongoDB > KV > Demo (but MongoDB is server-side only)
    if (typeof window === 'undefined' && !config.mongodb.isDemo && process.env.MONGODB_URI) {
      // Dynamic import MongoDB repository only on server-side
      const MongoDBContractRepository = require('./mongodb-contract-repository').MongoDBContractRepository;
      return new MongoDBContractRepository();
    }
    
    if (!config.kv.isDemo && process.env.KV_REST_API_URL) {
      return new KVContractRepository();
    }
    
    // Fallback to demo mode
    return new DemoContractRepository();
  }
}

// Singleton pattern for repository factory
let factoryInstance: RepositoryFactory | null = null;

export function getRepositoryFactory(): RepositoryFactory {
  if (!factoryInstance) {
    factoryInstance = new DefaultRepositoryFactory();
  }
  return factoryInstance;
}

// Convenience function to get contract repository directly
export function getContractRepository(): ContractRepository {
  return getRepositoryFactory().createContractRepository();
}