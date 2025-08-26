export interface User {
  id: string;
  email: string;
  passwordHash: string;
  masterKeySalt: string;
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface Credential {
  id: string;
  userId: string;
  title: string;
  username: string;
  password: string; // Encrypted
  url?: string;
  notes?: string; // Encrypted
  folderId?: string;
  tags: string[];
  favorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  parentId?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface TwoFactorCode {
  id: string;
  userId: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
  used: boolean;
}

export interface PasswordHistory {
  id: string;
  credentialId: string;
  password: string; // Encrypted
  changedAt: Date;
}

export interface SecurityAudit {
  id: string;
  userId: string;
  action: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CreateCredentialRequest {
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  folderId?: string;
  tags?: string[];
  favorite?: boolean;
}

export interface UpdateCredentialRequest {
  title?: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  folderId?: string;
  tags?: string[];
  favorite?: boolean;
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string;
  color?: string;
}

export interface UpdateFolderRequest {
  name?: string;
  parentId?: string;
  color?: string;
}

export interface SearchRequest {
  query: string;
  folderId?: string;
  tags?: string[];
  favorite?: boolean;
  limit?: number;
  offset?: number;
}

export interface PasswordStrengthResult {
  score: number; // 0-4
  feedback: string[];
  suggestions: string[];
}

export interface EncryptionMetadata {
  algorithm: string;
  keyDerivation: string;
  iterations: number;
  keyLength: number;
  ivLength: number;
  authTagLength: number;
}
