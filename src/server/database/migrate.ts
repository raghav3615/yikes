import DatabaseConnection from './connection';

const db = DatabaseConnection.getInstance();

const createTables = async (): Promise<void> => {
  try {
    console.log('Starting database migration...');

    // Users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        master_key_salt VARCHAR(255) NOT NULL,
        two_factor_secret VARCHAR(255),
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // Folders table
    await db.query(`
      CREATE TABLE IF NOT EXISTS folders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
        color VARCHAR(7),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, name, parent_id)
      )
    `);

    // Tags table
    await db.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, name)
      )
    `);

    // Credentials table
    await db.query(`
      CREATE TABLE IF NOT EXISTS credentials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL,
        password TEXT NOT NULL,
        url TEXT,
        notes TEXT,
        folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
        tags TEXT[] DEFAULT '{}',
        favorite BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_used_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // Sessions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        user_agent TEXT,
        ip_address INET
      )
    `);

    // Two-factor codes table
    await db.query(`
      CREATE TABLE IF NOT EXISTS two_factor_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        used BOOLEAN DEFAULT FALSE
      )
    `);

    // Password history table
    await db.query(`
      CREATE TABLE IF NOT EXISTS password_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        credential_id UUID NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
        password TEXT NOT NULL,
        changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Security audit table
    await db.query(`
      CREATE TABLE IF NOT EXISTS security_audit (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        details TEXT,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create indexes for better performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_credentials_user_id ON credentials(user_id);
      CREATE INDEX IF NOT EXISTS idx_credentials_folder_id ON credentials(folder_id);
      CREATE INDEX IF NOT EXISTS idx_credentials_favorite ON credentials(favorite);
      CREATE INDEX IF NOT EXISTS idx_credentials_created_at ON credentials(created_at);
      CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
      CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
      CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_two_factor_codes_user_id ON two_factor_codes(user_id);
      CREATE INDEX IF NOT EXISTS idx_two_factor_codes_expires_at ON two_factor_codes(expires_at);
      CREATE INDEX IF NOT EXISTS idx_password_history_credential_id ON password_history(credential_id);
      CREATE INDEX IF NOT EXISTS idx_security_audit_user_id ON security_audit(user_id);
      CREATE INDEX IF NOT EXISTS idx_security_audit_created_at ON security_audit(created_at);
    `);

    // Create full-text search index for credentials
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_credentials_search ON credentials USING GIN (
        to_tsvector('english', title || ' ' || username || ' ' || COALESCE(url, '') || ' ' || COALESCE(notes, ''))
      );
    `);

    console.log('Database migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

const dropTables = async (): Promise<void> => {
  try {
    console.log('Dropping all tables...');
    
    const tables = [
      'security_audit',
      'password_history',
      'two_factor_codes',
      'sessions',
      'credentials',
      'tags',
      'folders',
      'users'
    ];

    for (const table of tables) {
      await db.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    }

    console.log('All tables dropped successfully!');
  } catch (error) {
    console.error('Drop tables failed:', error);
    throw error;
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === '--drop') {
    dropTables()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    createTables()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}

export { createTables, dropTables };
