// 認証関連の型定義

export interface AccessToken {
  _id?: string;
  token: string;
  email: string;
  contractId: string;
  partyId: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  lastAccessedAt?: Date;
}

export interface ContractAccess {
  contractId: string;
  partyId: string;
  email: string;
  name: string;
  company?: string;
  role: string;
  canSign: boolean;
  canView: boolean;
  lastAccessed?: Date;
}

export interface AuthSession {
  id: string;
  email: string;
  contractAccess: ContractAccess[];
  expiresAt: Date;
}