/**
 * Import Configuration Registry
 * Defines import settings for each data type
 */

const customerConfig = {
    entityName: 'customer',
    tableName: 'customers',
    primaryKey: 'customer_id',
    serviceName: 'customers',

    // Required fields by mode
    requiredFields: {
        add: ['email'],
        update: ['customer_id']
    },

    // All allowed fields
    allowedFields: ['customer_id', 'email', 'name', 'status', 'topics_of_interest'],

    // Unique constraint checking
    uniqueFields: [
        {
            field: 'email',
            checkMethod: 'getCustomerByEmail',
            message: 'Email already exists'
        }
    ],

    // Field validation rules
    fieldValidations: {
        customer_id: {
            type: 'integer',
            required: { add: false, update: true }
        },
        email: {
            type: 'email',
            maxLength: 255,
            required: { add: true, update: false }
        },
        name: {
            type: 'string',
            maxLength: 255,
            required: { add: false, update: false }
        },
        status: {
            type: 'enum',
            values: ['active', 'inactive'],
            default: 'active',
            required: { add: false, update: false }
        },
        topics_of_interest: {
            type: 'array',
            separator: ',',
            maxItems: 10,
            maxItemLength: 100,
            required: { add: false, update: false }
        }
    },

    // Template configuration
    templates: {
        add: {
            headers: ['email', 'name', 'status', 'topics_of_interest'],
            exampleRow: ['user@example.com', 'John Doe', 'active', '"technology,business"'],
            instructions: [
                'Email is required and must be unique',
                'Status must be "active" or "inactive"',
                'Topics should be comma-separated without quotes'
            ]
        },
        update: {
            headers: ['customer_id', 'email', 'name', 'status', 'topics_of_interest'],
            exampleRow: ['1', 'updated@example.com', 'Updated Name', 'inactive', '"technology,marketing"'],
            instructions: [
                'Customer ID is required and must exist in database',
                'Only provide fields you want to update',
                'Email must be unique if being changed'
            ]
        }
    }
};

const bookConfig = {
    entityName: 'book',
    tableName: 'books',
    primaryKey: 'book_id',
    serviceName: 'books',

    requiredFields: {
        add: ['title', 'author'],
        update: ['book_id']
    },

    allowedFields: ['book_id', 'title', 'author', 'genre', 'topics', 'status'],

    // Books have compound uniqueness (title + author combination)
    uniqueFields: [
        {
            fields: ['title', 'author'],
            checkMethod: 'getBookByTitleAndAuthor',
            message: 'Book with this title and author already exists'
        }
    ],

    fieldValidations: {
        book_id: {
            type: 'integer',
            required: { add: false, update: true }
        },
        title: {
            type: 'string',
            maxLength: 255,
            required: { add: true, update: false }
        },
        author: {
            type: 'string',
            maxLength: 255,
            required: { add: true, update: false }
        },
        genre: {
            type: 'string',
            maxLength: 100,
            required: { add: false, update: false }
        },
        topics: {
            type: 'array',
            separator: ',',
            maxItems: 10,
            maxItemLength: 100,
            required: { add: false, update: false }
        },
        status: {
            type: 'enum',
            values: ['draft', 'published', 'archived'],
            default: 'published',
            required: { add: false, update: false }
        }
    },

    templates: {
        add: {
            headers: ['title', 'author', 'genre', 'topics', 'status'],
            exampleRow: ['The Future of Technology', 'Dr. Sarah Tech', 'Technology', '"technology,ai,future"', 'published'],
            instructions: [
                'Title and author are required',
                'Status must be "draft" or "published" or "archived"',
                'Topics should be comma-separated without quotes'
            ]
        },
        update: {
            headers: ['book_id', 'title', 'author', 'genre', 'topics', 'status'],
            exampleRow: ['1', 'Updated Title', 'Updated Author', 'Science', '"science,research"', 'published'],
            instructions: [
                'Book ID is required and must exist in database',
                'Title and author combination must be unique if changed',
                'Only provide fields you want to update'
            ]
        }
    }
};

// Configuration registry
class ImportConfigRegistry {
    constructor() {
        this.configs = {
            customer: customerConfig,
            book: bookConfig
        };
    }

    getConfig(entityName) {
        const config = this.configs[entityName];
        if (!config) {
            throw new Error(`Import configuration not found for entity: ${entityName}`);
        }
        return config;
    }

    getAvailableEntities() {
        return Object.keys(this.configs);
    }

    hasEntity(entityName) {
        return this.configs.hasOwnProperty(entityName);
    }

    validateConfig(entityName) {
        const config = this.getConfig(entityName);
        const requiredProperties = [
            'entityName', 'tableName', 'primaryKey', 'serviceName',
            'requiredFields', 'allowedFields', 'fieldValidations', 'templates'
        ];

        const missing = requiredProperties.filter(prop => !config[prop]);
        if (missing.length > 0) {
            throw new Error(`Invalid configuration for ${entityName}. Missing: ${missing.join(', ')}`);
        }

        return true;
    }

    validateAllConfigs() {
        const entities = this.getAvailableEntities();
        entities.forEach(entity => this.validateConfig(entity));
        return true;
    }
}

// Create and export singleton instance
const importConfigs = new ImportConfigRegistry();

module.exports = importConfigs;