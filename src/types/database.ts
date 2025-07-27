import { Db, MongoClient } from 'mongodb';

export interface DatabaseCollections {
  contracts: 'contracts';
  templates: 'templates';
  users: 'users';
  audit_logs: 'audit_logs';
  ai_cache: 'ai_cache';
  sessions: 'sessions';
}

export interface MongoDBConnection {
  client: MongoClient | null;
  db: Db | null;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  projection?: Record<string, 0 | 1>;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface BulkOperationResult {
  success: boolean;
  inserted: number;
  updated: number;
  deleted: number;
  errors: string[];
}

export interface User {
  _id?: string;
  email: string;
  password?: string;
  name: string;
  company?: string;
  role: UserRole;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export type UserRole = 'admin' | 'manager' | 'user' | 'viewer';

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface Session {
  _id?: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface AICacheEntry {
  _id?: string;
  key: string;
  prompt: string;
  response: string;
  model: string;
  tokens: number;
  createdAt: Date;
  expiresAt: Date;
}

export interface DatabaseIndex {
  collection: string;
  fields: Record<string, 1 | -1 | 'text'>;
  options?: {
    unique?: boolean;
    sparse?: boolean;
    expireAfterSeconds?: number;
    partialFilterExpression?: Record<string, any>;
  };
}