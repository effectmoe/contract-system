import { kv } from '@vercel/kv';
import { config } from '../config/env';

export interface KVCache {
  get<T = any>(key: string): Promise<T | null>;
  set<T = any>(key: string, value: T, options?: { ex?: number }): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  expire(key: string, seconds: number): Promise<void>;
  ttl(key: string): Promise<number>;
}

class VercelKVService implements KVCache {
  private prefix: string;

  constructor(prefix: string = 'contract_system') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async get<T = any>(key: string): Promise<T | null> {
    // Demo mode or invalid config - return null
    if (config.kv.isDemo || config.isDemo || this.isInvalidKVConfig()) {
      return null;
    }
    
    try {
      const value = await kv.get<T>(this.getKey(key));
      return value;
    } catch (error) {
      console.error('KV get error:', error);
      return null;
    }
  }

  private isInvalidKVConfig(): boolean {
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;
    
    if (!kvUrl || !kvToken) return true;
    if (kvUrl.includes('your-kv-instance')) return true;
    if (kvUrl === 'demo-mode' || kvToken === 'demo-mode') return true;
    
    return false;
  }

  async set<T = any>(
    key: string,
    value: T,
    options?: { ex?: number }
  ): Promise<void> {
    // Demo mode or invalid config - do nothing
    if (config.kv.isDemo || config.isDemo || this.isInvalidKVConfig()) {
      return;
    }
    
    try {
      if (options?.ex) {
        await kv.set(this.getKey(key), value, { ex: options.ex });
      } else {
        await kv.set(this.getKey(key), value);
      }
    } catch (error) {
      console.error('KV set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    if (config.kv.isDemo || config.isDemo) {
      return;
    }
    
    try {
      await kv.del(this.getKey(key));
    } catch (error) {
      console.error('KV del error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (config.kv.isDemo || config.isDemo) {
      return false;
    }
    
    try {
      const result = await kv.exists(this.getKey(key));
      return result === 1;
    } catch (error) {
      console.error('KV exists error:', error);
      return false;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    if (config.kv.isDemo || config.isDemo) {
      return;
    }
    
    try {
      await kv.expire(this.getKey(key), seconds);
    } catch (error) {
      console.error('KV expire error:', error);
    }
  }

  async ttl(key: string): Promise<number> {
    if (config.kv.isDemo || config.isDemo) {
      return -1;
    }
    
    try {
      const ttl = await kv.ttl(this.getKey(key));
      return ttl;
    } catch (error) {
      console.error('KV ttl error:', error);
      return -1;
    }
  }
}

// Cache keys
export const CacheKeys = {
  session: (token: string) => `session:${token}`,
  contractDraft: (userId: string) => `draft:${userId}`,
  aiResponse: (prompt: string) => `ai:${hashString(prompt)}`,
  ocrResult: (fileHash: string) => `ocr:${fileHash}`,
  signatureToken: (token: string) => `sign:${token}`,
  rateLimit: (key: string) => `rate:${key}`,
  analytics: (type: string) => `analytics:${type}`,
} as const;

// Cache durations (in seconds)
export const CacheDurations = {
  session: 24 * 60 * 60, // 24 hours
  draft: 7 * 24 * 60 * 60, // 7 days
  aiResponse: 60 * 60, // 1 hour
  ocrResult: 24 * 60 * 60, // 24 hours
  signatureToken: 48 * 60 * 60, // 48 hours
  rateLimit: 60, // 1 minute
  analytics: 5 * 60, // 5 minutes
} as const;

// Helper function to hash strings for cache keys
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// Session management
export class SessionManager {
  private kv: KVCache;

  constructor() {
    this.kv = new VercelKVService();
  }

  async createSession(userId: string, token: string): Promise<void> {
    const sessionData = {
      userId,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
    };

    await this.kv.set(
      CacheKeys.session(token),
      sessionData,
      { ex: CacheDurations.session }
    );
  }

  async getSession(token: string): Promise<{ userId: string } | null> {
    const session = await this.kv.get(CacheKeys.session(token));
    if (session) {
      // Update last accessed time
      await this.kv.expire(CacheKeys.session(token), CacheDurations.session);
    }
    return session;
  }

  async deleteSession(token: string): Promise<void> {
    await this.kv.del(CacheKeys.session(token));
  }
}

// Rate limiting
export class RateLimiter {
  private kv: KVCache;

  constructor() {
    this.kv = new VercelKVService();
  }

  private isInvalidKVConfig(): boolean {
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;
    
    if (!kvUrl || !kvToken) return true;
    if (kvUrl.includes('your-kv-instance')) return true;
    if (kvUrl === 'demo-mode' || kvToken === 'demo-mode') return true;
    
    return false;
  }

  async checkLimit(
    key: string,
    limit: number,
    window: number = 60
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    // Demo mode or invalid config - always allow
    if (config.kv.isDemo || config.isDemo || this.isInvalidKVConfig()) {
      return {
        allowed: true,
        remaining: limit,
        resetAt: Date.now() + (window * 1000),
      };
    }
    
    const cacheKey = CacheKeys.rateLimit(key);
    const current = await this.kv.get<number>(cacheKey) || 0;

    if (current >= limit) {
      const ttl = await this.kv.ttl(cacheKey);
      return {
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + (ttl * 1000),
      };
    }

    await this.kv.set(cacheKey, current + 1, { ex: window });

    return {
      allowed: true,
      remaining: limit - current - 1,
      resetAt: Date.now() + (window * 1000),
    };
  }
}

// Export instances
export const kvCache = new VercelKVService();
export const sessionManager = new SessionManager();
export const rateLimiter = new RateLimiter();