#!/usr/bin/env node

const database = require('../src/core/database');
const readline = require('readline');

function askConfirmation(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
        });
    });
}

async function resetDatabase() {
    console.log('⚠️  DATABASE RESET WARNING');
    console.log('=' .repeat(50));
    console.log('This will permanently delete ALL data in the database!');
    console.log('- All customers will be removed');
    console.log('- All books will be removed');
    console.log('- All reading activities will be removed');
    console.log('- All email records will be removed');
    console.log('- All jobs will be removed');
    console.log('- Migration history will be reset');

    const confirmed = await askConfirmation('\nAre you absolutely sure? Type "yes" to continue: ');

    if (!confirmed) {
        console.log('❌ Database reset cancelled');
        process.exit(0);
    }

    try {
        // Initialize database connection
        const connected = await database.initialize();

        if (!connected) {
            console.error('❌ Cannot reset database: Connection failed');
            console.error('💡 Make sure DATABASE_URL is set and PostgreSQL is running');
            process.exit(1);
        }

        console.log('\n🔄 Resetting database...');

        // Reset database (drops all tables)
        await database.resetDatabase();

        console.log('🔄 Running fresh migrations...');

        // Run migrations from scratch
        await database.runMigrations();

        // Show final status
        const status = await database.getMigrationStatus();
        console.log('\n📊 Reset Complete:');
        console.log(`   Total migrations applied: ${status.applied}`);
        console.log(`   Database is now empty and ready for data`);

        console.log('\n✅ Database reset completed successfully');
        console.log('💡 You can now run "npm run db:seed" to add sample data');

    } catch (error) {
        console.error('❌ Database reset failed:', error.message);
        process.exit(1);
    } finally {
        await database.close();
        process.exit(0);
    }
}

resetDatabase();