const connection = require('./connection');
const migrationRunner = require('./migrationRunner');

// Models
const Customer = require('./models/Customer');
const Book = require('./models/Book');
const ReadingActivity = require('./models/ReadingActivity');
const Job = require('./models/Job');
const EmailRecord = require('./models/EmailRecord');

// Services
const customerService = require('./services/customerService');
const bookService = require('./services/bookService');
const activityService = require('./services/activityService');

class Database {
    constructor() {
        this.connection = connection;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('🔄 Initializing database...');

            // Initialize connection
            const pool = await this.connection.initialize();

            if (!pool) {
                console.log('⚠️  Database connection failed, but application will continue');
                return false;
            }

            // Initialize services with connection
            await customerService.initialize();
            await bookService.initialize();
            await activityService.initialize();

            // Run migrations
            await migrationRunner.runMigrations();

            this.isInitialized = true;
            console.log('✅ Database initialization completed');
            return true;
        } catch (error) {
            console.error('❌ Database initialization failed:', error.message);
            console.log('⚠️  Application will continue without database functionality');
            return false;
        }
    }

    async testConnection() {
        return await this.connection.testConnection();
    }

    isReady() {
        return this.connection.isReady() && this.isInitialized;
    }

    getPool() {
        return this.connection.getPool();
    }

    async close() {
        await this.connection.close();
        this.isInitialized = false;
    }

    // Migration methods
    async runMigrations() {
        return await migrationRunner.runMigrations();
    }

    async getMigrationStatus() {
        return await migrationRunner.getMigrationStatus();
    }

    async rollbackLastMigration() {
        return await migrationRunner.rollbackLastMigration();
    }

    async resetDatabase() {
        return await migrationRunner.resetDatabase();
    }

    // Service access methods - ensure they're initialized
    get customers() {
        if (!customerService.getPool()) {
            customerService.initialize();
        }
        return customerService;
    }

    get books() {
        if (!bookService.getPool()) {
            bookService.initialize();
        }
        return bookService;
    }

    get activities() {
        if (!activityService.getPool()) {
            activityService.initialize();
        }
        return activityService;
    }

    // Model access
    get models() {
        return {
            Customer,
            Book,
            ReadingActivity,
            Job,
            EmailRecord
        };
    }

    // Utility methods for development
    async getSystemStats() {
        if (!this.isReady()) {
            return { error: 'Database not available' };
        }

        try {
            const [
                customerCount,
                bookCount,
                activityCount,
                migrationStatus
            ] = await Promise.all([
                this.customers.getCustomerCount(),
                this.books.getBookCount(),
                this.activities.getActivityCount(),
                migrationRunner.getMigrationStatus()
            ]);

            return {
                customers: customerCount,
                books: bookCount,
                activities: activityCount,
                migrations: migrationStatus,
                connectionStatus: await this.testConnection()
            };
        } catch (error) {
            return { error: error.message };
        }
    }
}

// Export an instance of the Database class
const database = new Database();

// Also export individual components for direct access if needed
module.exports = database;
module.exports.connection = connection;
module.exports.migrationRunner = migrationRunner;
module.exports.models = {
    Customer,
    Book,
    ReadingActivity,
    Job,
    EmailRecord
};
module.exports.services = {
    customerService,
    bookService,
    activityService
};