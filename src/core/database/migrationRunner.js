const fs = require('fs');
const path = require('path');
const connection = require('./connection');

class MigrationRunner {
    constructor() {
        this.migrationsPath = path.join(__dirname, 'migrations');
    }

    async runMigrations() {
        const pool = connection.getPool();
        if (!pool) {
            throw new Error('Database connection not available');
        }

        try {
            // First, ensure schema_migrations table exists
            await this.ensureSchemaMigrationsTable();

            // Get all migration files
            const migrationFiles = this.getMigrationFiles();

            console.log(`Found ${migrationFiles.length} migration files`);

            // Run each migration
            for (const migrationFile of migrationFiles) {
                await this.runMigration(migrationFile);
            }

            console.log('✅ All migrations completed successfully');
        } catch (error) {
            console.error('❌ Migration failed:', error.message);
            throw error;
        }
    }

    async ensureSchemaMigrationsTable() {
        const pool = connection.getPool();
        const migrationPath = path.join(this.migrationsPath, '000_create_schema_migrations.sql');

        if (fs.existsSync(migrationPath)) {
            const sql = fs.readFileSync(migrationPath, 'utf8');
            await pool.query(sql);
            console.log('✅ Schema migrations table ready');
        } else {
            // Fallback: create table inline
            const sql = `
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    migration_id TEXT PRIMARY KEY,
                    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
            `;
            await pool.query(sql);
            console.log('✅ Schema migrations table created');
        }
    }

    getMigrationFiles() {
        if (!fs.existsSync(this.migrationsPath)) {
            console.log('No migrations directory found');
            return [];
        }

        return fs.readdirSync(this.migrationsPath)
            .filter(file => file.endsWith('.sql') && file !== '000_create_schema_migrations.sql')
            .sort(); // This ensures 001, 002, 003 order
    }

    async runMigration(migrationFile) {
        const pool = connection.getPool();
        const migrationId = migrationFile.replace('.sql', '');

        // Check if migration already applied
        const checkQuery = 'SELECT migration_id FROM schema_migrations WHERE migration_id = $1';
        const checkResult = await pool.query(checkQuery, [migrationId]);

        if (checkResult.rows.length > 0) {
            console.log(`⏭️  Migration ${migrationId} already applied, skipping`);
            return;
        }

        console.log(`🔄 Running migration: ${migrationId}`);

        try {
            // Read and execute migration SQL
            const migrationPath = path.join(this.migrationsPath, migrationFile);
            const sql = fs.readFileSync(migrationPath, 'utf8');

            // Execute in transaction
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                await client.query(sql);

                // Mark migration as applied
                await client.query(
                    'INSERT INTO schema_migrations (migration_id) VALUES ($1)',
                    [migrationId]
                );

                await client.query('COMMIT');
                console.log(`✅ Migration ${migrationId} completed successfully`);
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error(`❌ Migration ${migrationId} failed:`, error.message);
            throw error;
        }
    }

    async getAppliedMigrations() {
        const pool = connection.getPool();
        if (!pool) {
            throw new Error('Database connection not available');
        }

        try {
            const query = 'SELECT migration_id, applied_at FROM schema_migrations ORDER BY migration_id';
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            // If table doesn't exist yet, return empty array
            if (error.code === '42P01') {
                return [];
            }
            throw error;
        }
    }

    async getMigrationStatus() {
        const appliedMigrations = await this.getAppliedMigrations();
        const availableMigrations = this.getMigrationFiles();

        return {
            total: availableMigrations.length,
            applied: appliedMigrations.length,
            pending: availableMigrations.length - appliedMigrations.length,
            appliedMigrations: appliedMigrations.map(m => m.migration_id),
            pendingMigrations: availableMigrations
                .map(f => f.replace('.sql', ''))
                .filter(id => !appliedMigrations.some(m => m.migration_id === id))
        };
    }

    async rollbackLastMigration() {
        const appliedMigrations = await this.getAppliedMigrations();

        if (appliedMigrations.length === 0) {
            console.log('No migrations to rollback');
            return;
        }

        const lastMigration = appliedMigrations[appliedMigrations.length - 1];
        console.log(`⚠️  Rolling back migration: ${lastMigration.migration_id}`);

        // Note: This is a basic rollback that just removes the migration record
        // In a production system, you'd want to have actual rollback SQL files
        const pool = connection.getPool();
        await pool.query(
            'DELETE FROM schema_migrations WHERE migration_id = $1',
            [lastMigration.migration_id]
        );

        console.log(`✅ Rollback completed for: ${lastMigration.migration_id}`);
        console.log('⚠️  Note: You may need to manually undo database changes');
    }

    async resetDatabase() {
        console.log('⚠️  Resetting database - this will drop all tables!');

        const pool = connection.getPool();
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Drop tables in reverse dependency order
            await client.query('DROP TABLE IF EXISTS email_records CASCADE');
            await client.query('DROP TABLE IF EXISTS reading_activities CASCADE');
            await client.query('DROP TABLE IF EXISTS jobs CASCADE');
            await client.query('DROP TABLE IF EXISTS books CASCADE');
            await client.query('DROP TABLE IF EXISTS customers CASCADE');
            await client.query('DROP TABLE IF EXISTS schema_migrations CASCADE');

            await client.query('COMMIT');
            console.log('✅ Database reset completed');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = new MigrationRunner();