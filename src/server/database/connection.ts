import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'yikes_password_manager',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'your_secure_password',
      ssl: process.env.DB_SSL === 'true',
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    // Test connection on startup
    this.testConnection();
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  public async query(text: string, params?: any[]): Promise<any> {
    const client = await this.getClient();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async testConnection(): Promise<void> {
    try {
      const result = await this.query('SELECT NOW()');
      console.log('Database connected successfully:', result.rows[0].now);
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}

export default DatabaseConnection;
