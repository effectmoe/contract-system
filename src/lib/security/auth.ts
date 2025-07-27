import { NextRequest } from 'next/server';
import * as crypto from 'crypto';
import { sessionManager } from '@/lib/db/kv';
import { getDatabaseService } from '@/lib/db/mongodb';
import { User } from '@/types/database';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export class AuthService {
  /**
   * Generate secure token
   */
  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash password
   */
  hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verify password
   */
  verifyPassword(password: string, hashedPassword: string): boolean {
    const [salt, hash] = hashedPassword.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }

  /**
   * Create session
   */
  async createSession(userId: string): Promise<string> {
    const token = this.generateToken();
    await sessionManager.createSession(userId, token);
    return token;
  }

  /**
   * Get user from session
   */
  async getUserFromSession(token: string): Promise<AuthUser | null> {
    const session = await sessionManager.getSession(token);
    if (!session) return null;

    const userService = await getDatabaseService<User>('users');
    const user = await userService.findOne({ _id: session.userId });
    
    if (!user) return null;

    return {
      id: user._id!,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  /**
   * Extract token from request
   */
  extractToken(request: NextRequest): string | null {
    // Check Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check cookie
    const cookieToken = request.cookies.get('auth-token')?.value;
    if (cookieToken) {
      return cookieToken;
    }

    return null;
  }

  /**
   * Authenticate request
   */
  async authenticateRequest(request: NextRequest): Promise<AuthUser | null> {
    const token = this.extractToken(request);
    if (!token) return null;

    return await this.getUserFromSession(token);
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<{ user: AuthUser; token: string } | null> {
    const userService = await getDatabaseService<User>('users');
    const user = await userService.findOne({ email });

    if (!user || !user.password) return null;

    if (!this.verifyPassword(password, user.password)) {
      return null;
    }

    const token = await this.createSession(user._id!);

    return {
      user: {
        id: user._id!,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Register user
   */
  async register(
    email: string,
    password: string,
    name: string,
    company?: string
  ): Promise<{ user: AuthUser; token: string }> {
    const userService = await getDatabaseService<User>('users');

    // Check if user exists
    const existingUser = await userService.findOne({ email });
    if (existingUser) {
      throw new Error('このメールアドレスは既に登録されています');
    }

    // Create user
    const hashedPassword = this.hashPassword(password);
    const newUser = await userService.create({
      email,
      password: hashedPassword,
      name,
      company,
      role: 'user',
      permissions: [
        {
          resource: 'contracts',
          actions: ['create', 'read', 'update'],
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    } as User);

    const token = await this.createSession(newUser._id!);

    return {
      user: {
        id: newUser._id!,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      token,
    };
  }

  /**
   * Logout
   */
  async logout(token: string): Promise<void> {
    await sessionManager.deleteSession(token);
  }

  /**
   * Check permission
   */
  hasPermission(
    user: AuthUser,
    resource: string,
    action: 'create' | 'read' | 'update' | 'delete'
  ): boolean {
    // Admin has all permissions
    if (user.role === 'admin') return true;

    // For demo, allow all authenticated users to access contracts
    if (resource === 'contracts') {
      if (action === 'read' || action === 'create' || action === 'update') {
        return true;
      }
      if (action === 'delete' && user.role === 'manager') {
        return true;
      }
    }

    return false;
  }
}

// Export singleton instance
export const authService = new AuthService();

// Auth middleware helper
export async function requireAuth(
  request: NextRequest,
  requiredPermission?: {
    resource: string;
    action: 'create' | 'read' | 'update' | 'delete';
  }
): Promise<AuthUser> {
  const user = await authService.authenticateRequest(request);
  
  if (!user) {
    throw new Error('認証が必要です');
  }

  if (requiredPermission) {
    if (!authService.hasPermission(user, requiredPermission.resource, requiredPermission.action)) {
      throw new Error('権限がありません');
    }
  }

  return user;
}