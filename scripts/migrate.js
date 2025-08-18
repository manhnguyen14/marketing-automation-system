#!/usr/bin/env node

const database = require('../src/core/database');

async function runMigrations() {
    console.log('🔄 Running database migrations...');

    try {
        // Initialize database connection
        const connected = await database.initialize();

        if (!connected) {
            console.error('❌ Cannot run migrations: Database connection failed');
            console.error('💡 Make sure DATABASE_URL is set and PostgreSQL is running');
            process.exit(1);
        }

        // Run migrations
        await database.runMigrations();

        // Show status
        const status = await database.getMigrationStatus();
        console.log('\n📊 Migration Status:');
        console.log(`   Total migrations: ${status.total}`);
        console.log(`   Applied: ${status.applied}`);
        console.log(`   Pending: ${status.pending}`);

        if (status.appliedMigrations.length > 0) {
            console.log('\n✅ Applied migrations:');
            status.appliedMigrations.forEach(id => console.log(`   - ${id}`));
        }

        if (status.pendingMigrations.length > 0) {
            console.log('\n⏳ Pending migrations:');
            status.pendingMigrations.forEach(id => console.log(`   - ${id}`));
        }

        console.log('\n✅ Migration process completed successfully');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await database.close();
        process.exit(0);
    }
}

runMigrations();