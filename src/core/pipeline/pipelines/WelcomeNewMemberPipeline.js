const PipelineInterface = require('./PipelineInterface');

class WelcomeNewMemberPipeline extends PipelineInterface {
    constructor() {
        super();
        this.pipelineName = 'WELCOME_NEW_MEMBER';
        this.templateType = 'predefined';
        this.defaultTemplateCode = 'WELCOME_NEW_MEMBER';

        // Configurable constants
        this.WELCOME_EMAIL_HOUR = 9; // 9 AM GMT+7
        this.WELCOME_EMAIL_TIMEZONE = '+07:00'; // GMT+7
        this.NEW_CUSTOMER_DAYS = 3; // Look for customers created in last 3 days
        this.EXCLUSION_DAYS = 4; // Exclude customers who received email in last 4 days
        this.BATCH_SIZE = 50; // Process 50 customers per run
        this.DEFAULT_CUSTOMER_NAME = 'New customer'; // Fallback name
    }

    /**
     * Main pipeline execution - creates queue items for new members
     */
    async runPipeline() {
        console.log('👋 Running Welcome New Member Pipeline...');
        return await this.createQueueItems();
    }

    /**
     * Create queue items for new customers who haven't received welcome email
     */
    async createQueueItems() {
        try {
            // Select new customers who haven't received welcome emails
            const customers = await this.selectNewCustomersForWelcome();

            if (customers.length === 0) {
                return { created: 0, failed: 0, message: 'No new customers found for welcome email' };
            }

            console.log(`🆕 Found ${customers.length} new customers for welcome email`);

            // Create queue items with SCHEDULED status (predefined template)
            const queueItems = customers.map(customer => {
                return this.createQueueItemData(customer, {
                    variables: {
                        customerName: customer.name || this.DEFAULT_CUSTOMER_NAME,
                        customerEmail: customer.email,
                        joinDate: this.formatDate(customer.createdAt)
                    },
                    tag: 'welcome_new_member',
                    scheduledDate: this.getWelcomeEmailTime()
                });
            });

            // Bulk create queue items
            return await this.bulkCreateQueueItems(queueItems);

        } catch (error) {
            console.error('❌ Welcome New Member Pipeline failed:', error.message);
            throw error;
        }
    }

    /**
     * Select new customers created in the last 3 days who haven't received welcome email
     */
    async selectNewCustomersForWelcome() {
        const connection = require('../../database/connection');
        const pool = connection.getPool();

        if (!pool) {
            throw new Error('Database connection not available');
        }

        // Calculate date ranges
        const now = new Date();
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(now.getDate() - this.NEW_CUSTOMER_DAYS);

        const fourDaysAgo = new Date();
        fourDaysAgo.setDate(now.getDate() - this.EXCLUSION_DAYS);

        console.log(`🔍 Looking for customers created after ${threeDaysAgo.toISOString()}`);
        console.log(`🚫 Excluding customers with welcome emails after ${fourDaysAgo.toISOString()}`);

        // SQL query to find new customers without recent welcome emails
        const query = `
            SELECT DISTINCT c.customer_id, c.email, c.name, c.created_at
            FROM customers c
            WHERE c.created_at >= $1
                AND c.status = 'active'
                AND c.customer_id NOT IN (
                    SELECT DISTINCT eq.customer_id 
                    FROM email_queue_items eq 
                    WHERE eq.pipeline_name = $2 
                        AND eq.created_at >= $3
                        AND eq.customer_id IS NOT NULL
                )
            ORDER BY c.created_at ASC
            LIMIT $4
        `;

        const values = [
            threeDaysAgo.toISOString(),
            this.pipelineName,
            fourDaysAgo.toISOString(),
            this.BATCH_SIZE
        ];

        try {
            const result = await pool.query(query, values);

            console.log(`📊 Query returned ${result.rows.length} customers`);

            return result.rows.map(row => ({
                customerId: row.customer_id,
                email: row.email,
                name: row.name,
                createdAt: row.created_at
            }));

        } catch (error) {
            console.error('❌ Database query failed:', error.message);
            throw new Error(`Failed to query new customers: ${error.message}`);
        }
    }

    /**
     * Calculate the next welcome email time (9 AM GMT+7 today or tomorrow)
     */
    getWelcomeEmailTime() {
        const now = new Date();

        // Create target time for today at 9 AM GMT+7
        const todayWelcomeTime = new Date();
        todayWelcomeTime.setHours(this.WELCOME_EMAIL_HOUR, 0, 0, 0);

        // Adjust for GMT+7 timezone
        // Note: This is a simplified approach. In production, consider using a proper timezone library
        const timezoneOffsetHours = 7; // GMT+7
        const currentTimezoneOffset = now.getTimezoneOffset() / 60; // Current timezone offset in hours
        const adjustmentHours = timezoneOffsetHours - currentTimezoneOffset;

        todayWelcomeTime.setHours(todayWelcomeTime.getHours() - adjustmentHours);

        // If current time has passed today's welcome time, schedule for tomorrow
        if (now > todayWelcomeTime) {
            const tomorrowWelcomeTime = new Date(todayWelcomeTime);
            tomorrowWelcomeTime.setDate(tomorrowWelcomeTime.getDate() + 1);

            console.log(`⏰ Today's 9 AM has passed, scheduling for tomorrow: ${tomorrowWelcomeTime.toISOString()}`);
            return tomorrowWelcomeTime;
        } else {
            console.log(`⏰ Scheduling for today at 9 AM: ${todayWelcomeTime.toISOString()}`);
            return todayWelcomeTime;
        }
    }

    /**
     * Format date for display in email
     */
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Get pipeline configuration summary
     */
    getPipelineConfig() {
        return {
            ...this.getPipelineInfo(),
            welcomeEmailHour: this.WELCOME_EMAIL_HOUR,
            newCustomerDays: this.NEW_CUSTOMER_DAYS,
            exclusionDays: this.EXCLUSION_DAYS,
            batchSize: this.BATCH_SIZE,
            defaultCustomerName: this.DEFAULT_CUSTOMER_NAME,
            timezone: this.WELCOME_EMAIL_TIMEZONE
        };
    }

    /**
     * Static method to create welcome template (if needed)
     */
    static async createWelcomeTemplate() {
        const emailTemplateService = require('../../database/services/emailTemplateService');

        const templateData = {
            name: 'Welcome New Member',
            template_code: 'WELCOME_NEW_MEMBER',
            subject_template: 'Welcome to our community, {{customerName}}! 🎉',
            html_template: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 40px; text-align: center;">
                        <h1 style="margin: 0; font-size: 32px;">🎉 Welcome!</h1>
                        <p style="margin: 10px 0 0 0; font-size: 18px;">We're thrilled to have you join us</p>
                    </div>
                    
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #2c3e50; margin-top: 0;">Hello {{customerName}}!</h2>
                        
                        <p style="font-size: 16px; line-height: 1.6; color: #555;">Welcome to our reading community! We're excited to have you on board since {{joinDate}}.</p>
                        
                        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin: 30px 0;">
                            <h3 style="margin: 0 0 15px 0; color: #2c3e50;">Here's what you can expect:</h3>
                            <ul style="margin: 0; padding-left: 20px; line-height: 1.8; color: #555;">
                                <li>Personalized book recommendations</li>
                                <li>Exclusive access to new releases</li>
                                <li>Daily reading motivation and tips</li>
                                <li>A supportive community of fellow readers</li>
                            </ul>
                        </div>
                        
                        <p style="font-size: 16px; line-height: 1.6; color: #555;">Ready to start your reading journey? Explore our collection and discover your next favorite book!</p>
                        
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="#" style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; font-size: 16px;">Start Reading</a>
                        </div>
                        
                        <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
                            Need help getting started? Just reply to this email - we're here to help!
                        </p>
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 25px; text-align: center;">
                        <p style="margin: 0; font-size: 14px; color: #666;">
                            Welcome aboard!<br>
                            <strong style="color: #4CAF50;">The Reading Community Team</strong>
                        </p>
                    </div>
                </div>
            `,
            text_template: `Welcome to our community, {{customerName}}!

Hello {{customerName}}!

Welcome to our reading community! We're excited to have you on board since {{joinDate}}.

Here's what you can expect:
• Personalized book recommendations
• Exclusive access to new releases  
• Daily reading motivation and tips
• A supportive community of fellow readers

Ready to start your reading journey? Explore our collection and discover your next favorite book!

Need help getting started? Just reply to this email - we're here to help!

Welcome aboard!
The Reading Community Team`,
            template_type: 'predefined',
            status: 'APPROVED',
            category: 'welcome',
            required_variables: ['customerName', 'customerEmail', 'joinDate']
        };

        try {
            return await emailTemplateService.createTemplate(templateData);
        } catch (error) {
            // Template might already exist
            console.log('Template may already exist:', error.message);
            throw error;
        }
    }

    /**
     * Validate pipeline configuration
     */
    validateConfig() {
        const baseValidation = super.validateConfig();
        const errors = [...baseValidation.errors];

        if (this.WELCOME_EMAIL_HOUR < 0 || this.WELCOME_EMAIL_HOUR > 23) {
            errors.push('Welcome email hour must be between 0 and 23');
        }

        if (this.NEW_CUSTOMER_DAYS < 1) {
            errors.push('New customer days must be at least 1');
        }

        if (this.EXCLUSION_DAYS < 1) {
            errors.push('Exclusion days must be at least 1');
        }

        if (this.BATCH_SIZE < 1 || this.BATCH_SIZE > 100) {
            errors.push('Batch size must be between 1 and 100');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get statistics about pipeline targeting
     */
    async getTargetingStats() {
        const connection = require('../../database/connection');
        const pool = connection.getPool();

        if (!pool) {
            throw new Error('Database connection not available');
        }

        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - this.NEW_CUSTOMER_DAYS);

        const fourDaysAgo = new Date();
        fourDaysAgo.setDate(fourDaysAgo.getDate() - this.EXCLUSION_DAYS);

        const statsQuery = `
            SELECT 
                COUNT(*) FILTER (WHERE c.created_at >= $1) as new_customers_count,
                COUNT(*) FILTER (WHERE c.created_at >= $1 AND c.customer_id IN (
                    SELECT DISTINCT eq.customer_id 
                    FROM email_queue_items eq 
                    WHERE eq.pipeline_name = $2 AND eq.created_at >= $3
                )) as already_welcomed_count,
                COUNT(*) FILTER (WHERE c.created_at >= $1 AND c.customer_id NOT IN (
                    SELECT DISTINCT eq.customer_id 
                    FROM email_queue_items eq 
                    WHERE eq.pipeline_name = $2 AND eq.created_at >= $3
                )) as eligible_count
            FROM customers c 
            WHERE c.status = 'active'
        `;

        const result = await pool.query(statsQuery, [
            threeDaysAgo.toISOString(),
            this.pipelineName,
            fourDaysAgo.toISOString()
        ]);

        return result.rows[0];
    }
}

module.exports = WelcomeNewMemberPipeline;