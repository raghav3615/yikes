import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import controllers
import AuthController from './controllers/auth';
import CredentialsController from './controllers/credentials';

// Import middleware
import AuthMiddleware from './middleware/auth';

// Import database
import DatabaseConnection from './database/connection';

// Load environment variables
dotenv.config();

class PasswordManagerServer {
  private app: express.Application;
  private server: any;
  private io: Server;
  private port: number;

  constructor() {
    this.port = parseInt(process.env.PORT || '3001');
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    });

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeWebSocket();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
      next();
    });

    // Rate limiting
    const rateLimitWindow = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000');
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');
    this.app.use(AuthMiddleware.createRateLimiter(maxRequests, rateLimitWindow));
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'Password Manager API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // API routes
    const apiRouter = express.Router();

    // Authentication routes (public)
    apiRouter.post('/auth/register', AuthController.register);
    apiRouter.post('/auth/login', AuthController.login);

    // Protected routes
    const protectedRouter = express.Router();
    protectedRouter.use(AuthMiddleware.authenticate);

    // Auth protected routes
    protectedRouter.post('/auth/logout', AuthController.logout);
    protectedRouter.get('/auth/profile', AuthController.getProfile);
    protectedRouter.post('/auth/refresh', AuthController.refreshToken);

    // Credentials routes
    protectedRouter.post('/credentials', CredentialsController.create);
    protectedRouter.get('/credentials', CredentialsController.getAll);
    protectedRouter.get('/credentials/search', CredentialsController.search);
    protectedRouter.get('/credentials/stats', CredentialsController.getStats);
    protectedRouter.get('/credentials/:id', CredentialsController.getById);
    protectedRouter.put('/credentials/:id', CredentialsController.update);
    protectedRouter.delete('/credentials/:id', CredentialsController.delete);
    protectedRouter.post('/credentials/:id/favorite', CredentialsController.toggleFavorite);

    // Mount protected routes
    apiRouter.use('/protected', protectedRouter);

    // Mount API router
    this.app.use('/api/v1', apiRouter);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found'
      });
    });
  }

  private initializeWebSocket(): void {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Handle real-time updates for password changes
      socket.on('join-user-room', (userId: string) => {
        socket.join(`user-${userId}`);
        console.log(`User ${userId} joined their room`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    // Make io available to controllers
    (this.app as any).io = this.io;
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Global error handler:', error);

      if (error.type === 'entity.parse.failed') {
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON payload'
        });
      }

      if (error.type === 'entity.too.large') {
        return res.status(413).json({
          success: false,
          error: 'Payload too large'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGINT', this.gracefulShutdown.bind(this));
  }

  private async gracefulShutdown(): Promise<void> {
    console.log('Received shutdown signal, starting graceful shutdown...');

    try {
      // Close database connections
      await DatabaseConnection.getInstance().close();
      console.log('Database connections closed');

      // Close HTTP server
      this.server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  public async start(): Promise<void> {
    try {
      // Test database connection
      await DatabaseConnection.getInstance();
      console.log('Database connection established');

      // Start server
      this.server.listen(this.port, () => {
        console.log(`🚀 Password Manager Server running on port ${this.port}`);
        console.log(`📊 Health check: http://localhost:${this.port}/health`);
        console.log(`🔐 API endpoints: http://localhost:${this.port}/api/v1`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start server if this file is executed directly
if (require.main === module) {
  const server = new PasswordManagerServer();
  server.start().catch((error) => {
    console.error('Server startup failed:', error);
    process.exit(1);
  });
}

export default PasswordManagerServer;
