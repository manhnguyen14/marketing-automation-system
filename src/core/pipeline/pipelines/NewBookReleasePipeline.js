const PipelineInterface = require('./PipelineInterface');

class NewBookReleasePipeline extends PipelineInterface {
    constructor() {
        super();
        this.pipelineName = 'NEW_BOOK_RELEASE';
        this.templateType = 'predefined';
        this.defaultTemplateCode = null; // Will be set when template is created
        this.newBook = null; // Book to announce
    }

    /**
     * Initialize pipeline.js with specific book and template
     */
    initialize(newBook, templateCode) {
        this.newBook = newBook;
        this.defaultTemplateCode = templateCode;
        return this;
    }

    /**
     * Main pipeline.js execution - announces new book to interested customers
     */
    async runPipeline() {
        console.log('📚 Running New Book Release Pipeline...');

        if (!this.newBook) {
            throw new Error('New book must be specified for book release pipeline.js');
        }

        if (!this.defaultTemplateCode) {
            throw new Error('Template code must be specified for book release pipeline.js');
        }

        return await this.createQueueItems();
    }

    /**
     * Create queue items for customers interested in the book's topics
     */
    async createQueueItems() {
        try {
            // Select customers with matching interests
            const customers = await this.selectTargetCustomers();

            if (customers.length === 0) {
                return { created: 0, failed: 0, message: 'No customers found with matching interests' };
            }

            console.log(`📖 Found ${customers.length} customers interested in "${this.newBook.title}"`);

            // Create queue items with SCHEDULED status (predefined template)
            const queueItems = customers.map(customer => {
                return this.createQueueItemData(customer, {
                    variables: {
                        customerName: customer.name || 'Reader',
                        customerEmail: customer.email,
                        bookTitle: this.newBook.title,
                        bookAuthor: this.newBook.author,
                        bookGenre: this.newBook.genre,
                        bookTopics: this.newBook.topics?.join(', ') || '',
                        releaseDate: this.formatDate(new Date())
                    },
                    tag: 'book_release',
                    scheduledDate: new Date() // Send immediately
                });
            });

            // Bulk create queue items
            return await this.bulkCreateQueueItems(queueItems);

        } catch (error) {
            console.error('❌ New Book Release Pipeline failed:', error.message);
            throw error;
        }
    }

    /**
     * Select customers with book interests matching the new book
     */
    async selectTargetCustomers() {
        const customerService = this.getCustomerService();

        if (!this.newBook?.topics || this.newBook.topics.length === 0) {
            console.warn('⚠️ Book has no topics defined, selecting customers by genre');
            // Fallback to genre-based selection
            return await this.selectCustomersByGenre();
        }

        console.log(`🎯 Selecting customers interested in: ${this.newBook.topics.join(', ')}`);

        // Get customers with matching topic interests
        const customers = await customerService.getCustomersByTopics(this.newBook.topics);

        // Also include customers interested in the genre if different from topics
        if (this.newBook.genre && !this.newBook.topics.includes(this.newBook.genre.toLowerCase())) {
            const genreCustomers = await customerService.getCustomersByTopics([this.newBook.genre.toLowerCase()]);

            // Merge and deduplicate
            const customerMap = new Map();
            [...customers, ...genreCustomers].forEach(customer => {
                customerMap.set(customer.customerId, customer);
            });

            return Array.from(customerMap.values()).slice(0, 100); // Limit to 100
        }

        return customers.slice(0, 100); // Limit to 100 for initial release
    }

    /**
     * Fallback: Select customers by genre only
     */
    async selectCustomersByGenre() {
        if (!this.newBook?.genre) {
            console.warn('⚠️ Book has no genre defined, selecting recent active customers');
            const customerService = this.getCustomerService();
            return await customerService.getActiveCustomers({ limit: 50 });
        }

        const customerService = this.getCustomerService();
        return await customerService.getCustomersByTopics([this.newBook.genre.toLowerCase()]);
    }

    /**
     * Create predefined template for new book announcements
     */
    static async createBookReleaseTemplate(category = 'book_release') {
        const emailTemplateService = require('../../database/services/emailTemplateService');

        const templateData = {
            name: 'New Book Release Announcement',
            template_code: `new_book_release_template_${Date.now()}`,
            subject_template: 'New Book: {{bookTitle}} by {{bookAuthor}} 📚',
            html_template: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px;">📚 New Book Release!</h1>
                    </div>
                    
                    <div style="padding: 30px;">
                        <h2 style="color: #2c3e50; margin-top: 0;">Hello {{customerName}}!</h2>
                        
                        <p style="font-size: 16px; line-height: 1.6;">We're excited to announce a new book that matches your reading interests:</p>
                        
                        <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0;">
                            <h3 style="margin: 0 0 10px 0; color: #2c3e50;">{{bookTitle}}</h3>
                            <p style="margin: 0; color: #6c757d;"><strong>By:</strong> {{bookAuthor}}</p>
                            <p style="margin: 5px 0 0 0; color: #6c757d;"><strong>Genre:</strong> {{bookGenre}}</p>
                            {{#if bookTopics}}<p style="margin: 5px 0 0 0; color: #6c757d;"><strong>Topics:</strong> {{bookTopics}}</p>{{/if}}
                        </div>
                        
                        <p style="font-size: 16px; line-height: 1.6;">This book covers topics you've shown interest in, and we think you'll love it!</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="#" style="background-color: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Get This Book</a>
                        </div>
                        
                        <p style="font-size: 14px; color: #6c757d; text-align: center;">Available now in your library</p>
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #6c757d;">
                        <p style="margin: 0;">Happy reading!<br>The Library Team</p>
                    </div>
                </div>
            `,
            text_template: `New Book Release: {{bookTitle}}

Hello {{customerName}}!

We're excited to announce a new book that matches your reading interests:

{{bookTitle}}
By: {{bookAuthor}}
Genre: {{bookGenre}}
{{#if bookTopics}}Topics: {{bookTopics}}{{/if}}

This book covers topics you've shown interest in, and we think you'll love it!

Available now in your library.

Happy reading!
The Library Team`,
            template_type: 'predefined',
            status: 'APPROVED',
            category: category,
            required_variables: ['customerName', 'customerEmail', 'bookTitle', 'bookAuthor', 'bookGenre']
        };

        return await emailTemplateService.createTemplate(templateData);
    }

    /**
     * Static method to run pipeline.js for specific book
     */
    static async runForBook(bookData, templateCode = null) {
        // Create template if not provided
        if (!templateCode) {
            const template = await NewBookReleasePipeline.createBookReleaseTemplate();
            templateCode = template.templateCode;
        }

        // Create and run pipeline.js
        const pipeline = new NewBookReleasePipeline();
        pipeline.initialize(bookData, templateCode);

        return await pipeline.runPipeline();
    }

    /**
     * Format date for display
     */
    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Validate book data
     */
    validateBookData() {
        const errors = [];

        if (!this.newBook) {
            errors.push('Book data is required');
            return { isValid: false, errors };
        }

        if (!this.newBook.title) {
            errors.push('Book title is required');
        }

        if (!this.newBook.author) {
            errors.push('Book author is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = NewBookReleasePipeline;