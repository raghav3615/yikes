import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import DatabaseConnection from '../database/connection';
import { User } from '../types';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export class AuthMiddleware {
  /**
   * Verify JWT token and attach user to request
   */
  static async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: 'Access token required'
        });
        return;
      }

      const token = authHeader.substring(7);
      const secret = process.env.JWT_SECRET;

      if (!secret) {
        console.error('JWT_SECRET not configured');
        res.status(500).json({
          success: false,
          error: 'Server configuration error'
        });
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, secret) as JWTPayload;
      
      // Check if session exists and is valid
      const db = DatabaseConnection.getInstance();
      const sessionResult = await db.query(
        'SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()',
        [token]
      );

      if (sessionResult.rows.length === 0) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired session'
        });
        return;
      }

      // Get user information
      const userResult = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0) {
        res.status(401).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      const user = userResult.rows[0] as User;
      req.user = user;

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          error: 'Invalid token'
        });
      } else if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          error: 'Token expired'
        });
      } else {
        console.error('Authentication error:', error);
        res.status(500).json({
          success: false,
          error: 'Authentication failed'
        });
      }
    }
  }

  /**
   * Optional authentication - doesn't fail if no token provided
   */
  static async optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
      }

      const token = authHeader.substring(7);
      const secret = process.env.JWT_SECRET;

      if (!secret) {
        next();
        return;
      }

      const decoded = jwt.verify(token, secret) as JWTPayload;
      
      const db = DatabaseConnection.getInstance();
      const sessionResult = await db.query(
        'SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()',
        [token]
      );

      if (sessionResult.rows.length > 0) {
        const userResult = await db.query(
          'SELECT * FROM users WHERE id = $1',
          [decoded.userId]
        );

        if (userResult.rows.length > 0) {
          req.user = userResult.rows[0] as User;
        }
      }

      next();
    } catch (error) {
      // Silently continue if authentication fails
      next();
    }
  }

  /**
   * Check if user has specific role (for future role-based access control)
   */
  static requireRole(role: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // For now, all authenticated users have access
      // Future: implement role-based access control
      next();
    };
  }

  /**
   * Rate limiting middleware
   */
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction): void => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      
      const userRequests = requests.get(ip);
      
      if (!userRequests || now > userRequests.resetTime) {
        requests.set(ip, { count: 1, resetTime: now + windowMs });
        next();
        return;
      }

      if (userRequests.count >= maxRequests) {
        res.status(429).json({
          success: false,
          error: 'Too many requests, please try again later'
        });
        return;
      }

      userRequests.count++;
      next();
    };
  }
}

export default AuthMiddleware;
