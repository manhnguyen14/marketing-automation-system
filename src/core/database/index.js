const connection = require('./connection');
const migrationRunner = require('./migrationRunner');

// Models
const Customer = require('./models/Customer');
const Book = require('./models/Book');
const EmailRecord = require('./models/EmailRecord');
const EmailTemplate = require('./models/EmailTemplate');
const EmailQueueItem = require('./models/EmailQueueItem'); // ✅ ADD
const PipelineExecutionLog = require('./models/PipelineExecutionLog'); // ✅ ADD

// Services
const customerService = require('./services/customerService');
const bookService = require('./services/bookService');
const emailTemplateService = require('./services/emailTemplateService');
const emailRecordService = require('./services/emailRecordService');
const emailQueueService = require('./services/emailQueueService'); // ✅ ADD
const pipelineExecutionService = require('./services/pipelineExecutionService'); // ✅ ADD

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

            // Run migrations when initialize database
            await migrationRunner.runMigrations();

            // Initialize services with connection
            await customerService.initialize();
            await bookService.initialize();
            await emailTemplateService.initialize();
            await emailRecordService.initialize();
            await emailQueueService.initialize(); // ✅ ADD
            await pipelineExecutionService.initialize(); // ✅ ADD

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

    get emailTemplates() {
        if (!emailTemplateService.getPool()) {
            emailTemplateService.initialize();
        }
        return emailTemplateService;
    }

    get emailRecords() {
        if (!emailRecordService.getPool()) {
            emailRecordService.initialize();
        }
        return emailRecordService;
    }

    // ✅ ADD: Pipeline services access methods
    get emailQueue() {
        if (!emailQueueService.getPool()) {
            emailQueueService.initialize();
        }
        return emailQueueService;
    }

    get pipelineExecutions() {
        if (!pipelineExecutionService.getPool()) {
            pipelineExecutionService.initialize();
        }
        return pipelineExecutionService;
    }

    // Model access
    get models() {
        return {
            Customer,
            Book,
            EmailRecord,
            EmailTemplate,
            EmailQueueItem, // ✅ ADD
            PipelineExecutionLog // ✅ ADD
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
                emailTemplateCount,
                queueItemCount, // ✅ ADD
                pipelineExecutionCount, // ✅ ADD
                migrationStatus
            ] = await Promise.all([
                this.customers.getCustomerCount(),
                this.books.getBookCount(),
                this.emailTemplates.getTemplateCount(),
                this.emailQueue.getQueueCount(), // ✅ ADD
                this.pipelineExecutions.getExecutionStats().then(stats =>
                    stats.reduce((sum, stat) => sum + parseInt(stat.count), 0)
                ).catch(() => 0), // ✅ ADD
                migrationRunner.getMigrationStatus()
            ]);

            return {
                customers: customerCount,
                books: bookCount,
                emailTemplates: emailTemplateCount,
                queueItems: queueItemCount, // ✅ ADD
                pipelineExecutions: pipelineExecutionCount, // ✅ ADD
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

// export all models again for convenience for importing all models together
module.exports.models = {
    Customer,
    Book,
    EmailRecord,
    EmailTemplate,
    EmailQueueItem, // ✅ ADD
    PipelineExecutionLog // ✅ ADD
};

module.exports.services = {
    customerService,
    bookService,
    emailTemplateService,
    emailRecordService,
    emailQueueService, // ✅ ADD
    pipelineExecutionService // ✅ ADD
};