#!/usr/bin/env node

const database = require('../src/core/database');

async function showDatabaseStatus() {
    console.log('🔍 Checking database status...');

    try {
        // Initialize database connection
        const connected = await database.initialize();

        if (!connected) {
            console.error('❌ Database connection failed');
            console.error('💡 Make sure DATABASE_URL is set and PostgreSQL is running');
            process.exit(1);
        }

        // Get comprehensive status
        const [migrationStatus, systemStats, connectionTest] = await Promise.all([
            database.getMigrationStatus(),
            database.getSystemStats(),
            database.testConnection()
        ]);

        console.log('\n📊 Database Status Report');
        console.log('=' .repeat(50));

        // Connection status
        console.log('\n🔗 Connection Status:');
        console.log(`   Connected: ${connectionTest.connected ? '✅ Yes' : '❌ No'}`);
        if (connectionTest.connected) {
            console.log(`   Response time: ${connectionTest.responseTime}`);
            if (connectionTest.poolStatus) {
                console.log(`   Pool total: ${connectionTest.poolStatus.total}`);
                console.log(`   Pool idle: ${connectionTest.poolStatus.idle}`);
                console.log(`   Pool waiting: ${connectionTest.poolStatus.waiting}`);
            }
        }

        // Migration status
        console.log('\n📋 Migration Status:');
        console.log(`   Total migrations: ${migrationStatus.total}`);
        console.log(`   Applied: ${migrationStatus.applied}`);
        console.log(`   Pending: ${migrationStatus.pending}`);

        if (migrationStatus.appliedMigrations.length > 0) {
            console.log('\n   Applied migrations:');
            migrationStatus.appliedMigrations.forEach(id => console.log(`     ✅ ${id}`));
        }

        if (migrationStatus.pendingMigrations.length > 0) {
            console.log('\n   Pending migrations:');
            migrationStatus.pendingMigrations.forEach(id => console.log(`     ⏳ ${id}`));
        }

        // Data statistics
        if (!systemStats.error) {
            console.log('\n📈 Data Statistics:');
            console.log(`   Customers: ${systemStats.customers}`);
            console.log(`   Books: ${systemStats.books}`);
            console.log(`   Reading activities: ${systemStats.activities}`);
        }

        console.log('\n✅ Database status check completed');

    } catch (error) {
        console.error('❌ Status check failed:', error.message);
        process.exit(1);
    } finally {
        await database.close();
        process.exit(0);
    }
}

showDatabaseStatus();