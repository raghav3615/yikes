import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import DatabaseConnection from '../database/connection';
import { 
  CreateCredentialRequest, 
  UpdateCredentialRequest, 
  SearchRequest,
  Credential,
  Folder,
  Tag,
  ApiResponse 
} from '../types';

export class CredentialsController {
  private static db = DatabaseConnection.getInstance();

  /**
   * Create a new credential
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
        return;
      }

      const credentialData: CreateCredentialRequest = req.body;
      const { title, username, password, url, notes, folderId, tags, favorite } = credentialData;

      // Validation
      if (!title || !username || !password) {
        res.status(400).json({
          success: false,
          error: 'Title, username, and password are required'
        });
        return;
      }

      // Validate folder exists and belongs to user
      if (folderId) {
        const folderResult = await this.db.query(
          'SELECT id FROM folders WHERE id = $1 AND user_id = $2',
          [folderId, req.user.id]
        );

        if (folderResult.rows.length === 0) {
          res.status(400).json({
            success: false,
            error: 'Invalid folder'
          });
          return;
        }
      }

      // Create credential
      const credentialResult = await this.db.query(
        `INSERT INTO credentials (
          user_id, title, username, password, url, notes, folder_id, tags, favorite
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          req.user.id,
          title,
          username,
          password, // This should be encrypted on the client side
          url || null,
          notes || null,
          folderId || null,
          tags || [],
          favorite || false
        ]
      );

      const credential = credentialResult.rows[0] as Credential;

      // Log security audit
      await this.db.query(
        `INSERT INTO security_audit (user_id, action, details, ip_address, user_agent) 
         VALUES ($1, $2, $3, $4, $5)`,
        [req.user.id, 'CREDENTIAL_CREATED', `Created credential: ${title}`, req.ip, req.get('User-Agent')]
      );

      res.status(201).json({
        success: true,
        message: 'Credential created successfully',
        data: credential
      });
    } catch (error) {
      console.error('Create credential error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create credential'
      });
    }
  }

  /**
   * Get all credentials for the authenticated user
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
        return;
      }

      const { folderId, favorite, limit = 100, offset = 0 } = req.query;

      let query = `
        SELECT c.*, f.name as folder_name, f.color as folder_color
        FROM credentials c
        LEFT JOIN folders f ON c.folder_id = f.id
        WHERE c.user_id = $1
      `;
      const params: any[] = [req.user.id];
      let paramIndex = 2;

      if (folderId) {
        query += ` AND c.folder_id = $${paramIndex}`;
        params.push(folderId);
        paramIndex++;
      }

      if (favorite === 'true') {
        query += ` AND c.favorite = true`;
      }

      query += ` ORDER BY c.favorite DESC, c.title ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await this.db.query(query, params);
      const credentials = result.rows;

      res.json({
        success: true,
        data: credentials,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: credentials.length
        }
      });
    } catch (error) {
      console.error('Get credentials error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get credentials'
      });
    }
  }

  /**
   * Get a specific credential by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
        return;
      }

      const { id } = req.params;

      const result = await this.db.query(
        `SELECT c.*, f.name as folder_name, f.color as folder_color
         FROM credentials c
         LEFT JOIN folders f ON c.folder_id = f.id
         WHERE c.id = $1 AND c.user_id = $2`,
        [id, req.user.id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Credential not found'
        });
        return;
      }

      const credential = result.rows[0] as Credential;

      res.json({
        success: true,
        data: credential
      });
    } catch (error) {
      console.error('Get credential error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get credential'
      });
    }
  }

  /**
   * Update a credential
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
        return;
      }

      const { id } = req.params;
      const updateData: UpdateCredentialRequest = req.body;

      // Check if credential exists and belongs to user
      const existingResult = await this.db.query(
        'SELECT * FROM credentials WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      if (existingResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Credential not found'
        });
        return;
      }

      const existingCredential = existingResult.rows[0] as Credential;

      // Validate folder if provided
      if (updateData.folderId) {
        const folderResult = await this.db.query(
          'SELECT id FROM folders WHERE id = $1 AND user_id = $2',
          [updateData.folderId, req.user.id]
        );

        if (folderResult.rows.length === 0) {
          res.status(400).json({
            success: false,
            error: 'Invalid folder'
          });
          return;
        }
      }

      // Build update query dynamically
      const updateFields: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          const dbKey = key === 'folderId' ? 'folder_id' : key;
          updateFields.push(`${dbKey} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No fields to update'
        });
        return;
      }

      // Add updated_at and WHERE clause
      updateFields.push(`updated_at = NOW()`);
      params.push(id, req.user.id);

      const query = `
        UPDATE credentials 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING *
      `;

      const result = await this.db.query(query, params);
      const updatedCredential = result.rows[0] as Credential;

      // Log security audit
      await this.db.query(
        `INSERT INTO security_audit (user_id, action, details, ip_address, user_agent) 
         VALUES ($1, $2, $3, $4, $5)`,
        [req.user.id, 'CREDENTIAL_UPDATED', `Updated credential: ${updatedCredential.title}`, req.ip, req.get('User-Agent')]
      );

      res.json({
        success: true,
        message: 'Credential updated successfully',
        data: updatedCredential
      });
    } catch (error) {
      console.error('Update credential error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update credential'
      });
    }
  }

  /**
   * Delete a credential
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
        return;
      }

      const { id } = req.params;

      // Check if credential exists and belongs to user
      const existingResult = await this.db.query(
        'SELECT title FROM credentials WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      if (existingResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Credential not found'
        });
        return;
      }

      const credentialTitle = existingResult.rows[0].title;

      // Delete credential
      await this.db.query(
        'DELETE FROM credentials WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      // Log security audit
      await this.db.query(
        `INSERT INTO security_audit (user_id, action, details, ip_address, user_agent) 
         VALUES ($1, $2, $3, $4, $5)`,
        [req.user.id, 'CREDENTIAL_DELETED', `Deleted credential: ${credentialTitle}`, req.ip, req.get('User-Agent')]
      );

      res.json({
        success: true,
        message: 'Credential deleted successfully'
      });
    } catch (error) {
      console.error('Delete credential error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete credential'
      });
    }
  }

  /**
   * Search credentials
   */
  static async search(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
        return;
      }

      const { query, folderId, tags, favorite, limit = 50, offset = 0 } = req.query;

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
        return;
      }

      let searchQuery = `
        SELECT c.*, f.name as folder_name, f.color as folder_color,
               ts_rank(to_tsvector('english', c.title || ' ' || c.username || ' ' || COALESCE(c.url, '') || ' ' || COALESCE(c.notes, '')), plainto_tsquery('english', $1)) as rank
        FROM credentials c
        LEFT JOIN folders f ON c.folder_id = f.id
        WHERE c.user_id = $2
          AND to_tsvector('english', c.title || ' ' || c.username || ' ' || COALESCE(c.url, '') || ' ' || COALESCE(c.notes, '')) @@ plainto_tsquery('english', $1)
      `;

      const params: any[] = [query, req.user.id];
      let paramIndex = 3;

      if (folderId) {
        searchQuery += ` AND c.folder_id = $${paramIndex}`;
        params.push(folderId);
        paramIndex++;
      }

      if (tags && Array.isArray(tags)) {
        searchQuery += ` AND c.tags && $${paramIndex}`;
        params.push(tags);
        paramIndex++;
      }

      if (favorite === 'true') {
        searchQuery += ` AND c.favorite = true`;
      }

      searchQuery += ` ORDER BY rank DESC, c.favorite DESC, c.title ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await this.db.query(searchQuery, params);
      const credentials = result.rows;

      res.json({
        success: true,
        data: credentials,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: credentials.length
        }
      });
    } catch (error) {
      console.error('Search credentials error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search credentials'
      });
    }
  }

  /**
   * Toggle favorite status
   */
  static async toggleFavorite(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
        return;
      }

      const { id } = req.params;

      const result = await this.db.query(
        `UPDATE credentials 
         SET favorite = NOT favorite, updated_at = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [id, req.user.id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Credential not found'
        });
        return;
      }

      const credential = result.rows[0] as Credential;

      res.json({
        success: true,
        message: `Credential ${credential.favorite ? 'added to' : 'removed from'} favorites`,
        data: credential
      });
    } catch (error) {
      console.error('Toggle favorite error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to toggle favorite'
      });
    }
  }

  /**
   * Get credential statistics
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
        return;
      }

      const statsResult = await this.db.query(`
        SELECT 
          COUNT(*) as total_credentials,
          COUNT(CASE WHEN favorite = true THEN 1 END) as favorite_count,
          COUNT(CASE WHEN folder_id IS NOT NULL THEN 1 END) as organized_count,
          COUNT(CASE WHEN tags != '{}' THEN 1 END) as tagged_count,
          COUNT(CASE WHEN last_used_at IS NOT NULL THEN 1 END) as used_count
        FROM credentials 
        WHERE user_id = $1
      `, [req.user.id]);

      const stats = statsResult.rows[0];

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get statistics'
      });
    }
  }
}

export default CredentialsController;
