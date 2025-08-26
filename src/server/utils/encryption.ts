import crypto from 'crypto';
import { promisify } from 'util';

const pbkdf2 = promisify(crypto.pbkdf2);
const randomBytes = promisify(crypto.randomBytes);

export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
  salt: string;
}

export interface MasterKey {
  key: Buffer;
  salt: string;
}

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly AUTH_TAG_LENGTH = 16; // 128 bits
  private static readonly PBKDF2_ITERATIONS = 100000;

  /**
   * Derive a master key from a password using PBKDF2
   */
  static async deriveMasterKey(password: string, salt?: string): Promise<MasterKey> {
    const saltBuffer = salt ? Buffer.from(salt, 'hex') : await randomBytes(32);
    const key = await pbkdf2(
      password,
      saltBuffer,
      this.PBKDF2_ITERATIONS,
      this.KEY_LENGTH,
      'sha512'
    );

    return {
      key,
      salt: saltBuffer.toString('hex')
    };
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  static async encrypt(data: string, masterKey: Buffer): Promise<EncryptedData> {
    const iv = await randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipher(this.ALGORITHM, masterKey);
    
    cipher.setAAD(Buffer.from('yikes-password-manager', 'utf8'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      salt: '' // Not used for AES-GCM, but kept for compatibility
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  static async decrypt(encryptedData: EncryptedData, masterKey: Buffer): Promise<string> {
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');
    
    const decipher = crypto.createDecipher(this.ALGORITHM, masterKey);
    decipher.setAAD(Buffer.from('yikes-password-manager', 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Generate a random encryption key
   */
  static async generateKey(): Promise<Buffer> {
    return await randomBytes(this.KEY_LENGTH);
  }

  /**
   * Generate a random salt
   */
  static async generateSalt(): Promise<string> {
    const salt = await randomBytes(32);
    return salt.toString('hex');
  }

  /**
   * Hash a password for storage (using bcrypt)
   */
  static async hashPassword(password: string): Promise<string> {
    const bcrypt = require('bcryptjs');
    return await bcrypt.hash(password, 12);
  }

  /**
   * Verify a password against a hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate a secure random string
   */
  static async generateSecureString(length: number = 32): Promise<string> {
    const bytes = await randomBytes(length);
    return bytes.toString('base64url').slice(0, length);
  }
}
