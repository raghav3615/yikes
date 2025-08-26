import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import DatabaseConnection from '../database/connection';
import { EncryptionService } from '../utils/encryption';
import { 
  LoginRequest, 
  RegisterRequest, 
  ApiResponse, 
  User,
  Session 
} from '../types';
import { AuthMiddleware } from '../middleware/auth';

export class AuthController {
  private static db = DatabaseConnection.getInstance();

  /**
   * User registration
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, confirmPassword }: RegisterRequest = req.body;

      // Validation
      if (!email || !password || !confirmPassword) {
        res.status(400).json({
          success: false,
          error: 'All fields are required'
        });
        return;
      }

      if (password !== confirmPassword) {
        res.status(400).json({
          success: false,
          error: 'Passwords do not match'
        });
        return;
      }

      if (password.length < 12) {
        res.status(400).json({
          success: false,
          error: 'Password must be at least 12 characters long'
        });
        return;
      }

      // Check if user already exists
      const existingUser = await this.db.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        res.status(409).json({
          success: false,
          error: 'User with this email already exists'
        });
        return;
      }

      // Hash password and create master key salt
      const passwordHash = await EncryptionService.hashPassword(password);
      const masterKeySalt = await EncryptionService.generateSalt();

      // Create user
      const userResult = await this.db.query(
        `INSERT INTO users (email, password_hash, master_key_salt) 
         VALUES ($1, $2, $3) RETURNING *`,
        [email.toLowerCase(), passwordHash, masterKeySalt]
      );

      const user = userResult.rows[0] as User;

      // Log security audit
      await this.db.query(
        `INSERT INTO security_audit (user_id, action, details, ip_address, user_agent) 
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, 'USER_REGISTERED', 'New user account created', req.ip, req.get('User-Agent')]
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          id: user.id,
          email: user.email,
          masterKeySalt: user.masterKeySalt
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed'
      });
    }
  }

  /**
   * User login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, twoFactorCode, rememberMe }: LoginRequest = req.body;

      // Validation
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
        return;
      }

      // Get user
      const userResult = await this.db.query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (userResult.rows.length === 0) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
        return;
      }

      const user = userResult.rows[0] as User;

      // Verify password
      const isValidPassword = await EncryptionService.verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        // Log failed login attempt
        await this.db.query(
          `INSERT INTO security_audit (user_id, action, details, ip_address, user_agent) 
           VALUES ($1, $2, $3, $4, $5)`,
          [user.id, 'LOGIN_FAILED', 'Invalid password', req.ip, req.get('User-Agent')]
        );

        res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
        return;
      }

      // Check two-factor authentication if enabled
      if (user.twoFactorEnabled) {
        if (!twoFactorCode) {
          res.status(400).json({
            success: false,
            error: 'Two-factor authentication code required'
          });
          return;
        }

        // Verify TOTP code
        const { authenticator } = require('otplib');
        const isValidTOTP = authenticator.verify({
          token: twoFactorCode,
          secret: user.twoFactorSecret
        });

        if (!isValidTOTP) {
          await this.db.query(
            `INSERT INTO security_audit (user_id, action, details, ip_address, user_agent) 
             VALUES ($1, $2, $3, $4, $5)`,
            [user.id, 'LOGIN_FAILED', 'Invalid 2FA code', req.ip, req.get('User-Agent')]
          );

          res.status(401).json({
            success: false,
            error: 'Invalid two-factor authentication code'
          });
          return;
        }
      }

      // Generate JWT token
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        res.status(500).json({
          success: false,
          error: 'Server configuration error'
        });
        return;
      }

      const expiresIn = rememberMe ? '7d' : '24h';
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        secret,
        { expiresIn }
      );

      // Create session
      const sessionId = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 7 : 1));

      await this.db.query(
        `INSERT INTO sessions (id, user_id, token, expires_at, user_agent, ip_address) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [sessionId, user.id, token, expiresAt, req.get('User-Agent'), req.ip]
      );

      // Update last login
      await this.db.query(
        'UPDATE users SET last_login_at = NOW() WHERE id = $1',
        [user.id]
      );

      // Log successful login
      await this.db.query(
        `INSERT INTO security_audit (user_id, action, details, ip_address, user_agent) 
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, 'LOGIN_SUCCESS', 'User logged in successfully', req.ip, req.get('User-Agent')]
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            twoFactorEnabled: user.twoFactorEnabled,
            masterKeySalt: user.masterKeySalt
          }
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed'
      });
    }
  }

  /**
   * User logout
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
        return;
      }

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        // Remove session
        await this.db.query(
          'DELETE FROM sessions WHERE token = $1',
          [token]
        );
      }

      // Log logout
      await this.db.query(
        `INSERT INTO security_audit (user_id, action, details, ip_address, user_agent) 
         VALUES ($1, $2, $3, $4, $5)`,
        [req.user.id, 'LOGOUT', 'User logged out', req.ip, req.get('User-Agent')]
      );

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed'
      });
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: req.user.id,
          email: req.user.email,
          twoFactorEnabled: req.user.twoFactorEnabled,
          createdAt: req.user.createdAt,
          lastLoginAt: req.user.lastLoginAt
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile'
      });
    }
  }

  /**
   * Refresh token
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
        return;
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        res.status(500).json({
          success: false,
          error: 'Server configuration error'
        });
        return;
      }

      // Generate new token
      const token = jwt.sign(
        { userId: req.user.id, email: req.user.email },
        secret,
        { expiresIn: '24h' }
      );

      // Update session
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const oldToken = authHeader.substring(7);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 1);

        await this.db.query(
          'UPDATE sessions SET token = $1, expires_at = $2 WHERE token = $3',
          [token, expiresAt, oldToken]
        );
      }

      res.json({
        success: true,
        data: { token }
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to refresh token'
      });
    }
  }
}

export default AuthController;
