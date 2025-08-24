const PipelineInterface = require('./PipelineInterface');

class DailyMotivationPipeline extends PipelineInterface {
    constructor() {
        super();
        this.pipelineName = 'DAILY_MOTIVATION';
        this.templateType = 'ai_generated';
        this.defaultTemplateCode = null;
    }

    /**
     * Main pipeline.js execution - creates queue items for engaged readers
     */
    async runPipeline() {
        console.log('📧 Running Daily Motivation Pipeline...');
        return await this.createQueueItems();
    }

    /**
     * Create queue items for customers with recent reading activity
     */
    async createQueueItems() {
        try {
            // Select engaged readers (customers with reading activity in last 7 days)
            const customers = await this.selectEngagedReaders();

            if (customers.length === 0) {
                return { created: 0, failed: 0, message: 'No engaged readers found' };
            }

            console.log(`📚 Found ${customers.length} engaged readers for motivation`);

            // Create queue items for AI generation
            const queueItems = customers.map(customer => {
                return this.createQueueItemData(customer, {
                    contextData: {
                        recentBooks: customer.recentBooks || [],
                        readingGoals: customer.readingGoals || 'continue reading',
                        lastActivityDate: customer.lastActivityDate,
                        completedBooks: customer.completedBooks || 0
                    },
                    variables: {
                        customerName: customer.name || 'Reader',
                        customerEmail: customer.email
                    },
                    tag: 'daily_motivation',
                    scheduledDate: this.getNextMotivationTime()
                });
            });

            // Bulk create queue items
            return await this.bulkCreateQueueItems(queueItems);

        } catch (error) {
            console.error('❌ Daily Motivation Pipeline failed:', error.message);
            throw error;
        }
    }

    /**
     * Select customers with recent reading activity
     */
    async selectEngagedReaders() {
        const customerService = this.getCustomerService();
        const activityService = require('../../database/services/activityService');

        // Get active customers
        const activeCustomers = await customerService.getActiveCustomers({
            limit: 100
        });

        if (activeCustomers.length === 0) {
            return [];
        }

        // Filter customers with recent reading activity
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const engagedReaders = [];

        for (const customer of activeCustomers) {
            try {
                // Check for recent reading activity (if activityService exists)
                // For now, include customers with topics of interest
                if (customer.topicsOfInterest && customer.topicsOfInterest.length > 0) {
                    engagedReaders.push({
                        customerId: customer.customerId,
                        email: customer.email,
                        name: customer.name,
                        topicsOfInterest: customer.topicsOfInterest,
                        // Mock recent activity data - replace with actual activity queries
                        recentBooks: customer.topicsOfInterest.slice(0, 2),
                        lastActivityDate: new Date(),
                        completedBooks: Math.floor(Math.random() * 10) + 1,
                        readingGoals: 'explore new topics'
                    });
                }
            } catch (error) {
                console.warn(`⚠️ Skipping customer ${customer.email}:`, error.message);
            }
        }

        return engagedReaders.slice(0, 20); // Limit to 20 for initial testing
    }

    /**
     * Generate AI template for motivation email
     */
    async generateTemplate(customerId, contextData, queueItemId) {
        try {
            console.log(`🤖 Generating motivation template for customer ${customerId}`);

            // Get customer details
            const customerService = this.getCustomerService();
            const customer = await customerService.getCustomerById(customerId);

            if (!customer) {
                throw new Error('Customer not found');
            }

            // Prepare AI prompt with customer context
            const prompt = this.buildMotivationPrompt(customer, contextData);

            // Mock AI generation - replace with actual Gemini AI call
            const aiContent = await this.mockAIGeneration(prompt, customer, contextData);

            // Create template in database
            const emailTemplateService = require('../../database/services/emailTemplateService');

            const templateData = {
                name: `Daily Motivation - ${customer.email} - ${new Date().toISOString()}`,
                template_code: `daily_motivation_${customer.customerId}_${Date.now()}`,
                subject_template: aiContent.subject,
                html_template: aiContent.html,
                text_template: aiContent.text,
                template_type: 'ai_generated',
                status: 'WAIT_REVIEW',
                category: 'daily_motivation',
                prompt: prompt,
                required_variables: ['customerName']
            };

            const template = await emailTemplateService.createTemplate(templateData);

            return {
                templateCode: template.templateCode,
                retryAllowed: true,
                nextScheduledDate: this.getNextMotivationTime()
            };

        } catch (error) {
            console.error(`❌ Template generation failed for customer ${customerId}:`, error.message);
            return {
                templateCode: null,
                retryAllowed: true,
                error: error.message
            };
        }
    }

    /**
     * Build AI prompt for motivation email
     */
    buildMotivationPrompt(customer, contextData) {
        return `Create a personalized daily reading motivation email for ${customer.name || 'the reader'}.

Customer Context:
- Email: ${customer.email}
- Topics of Interest: ${customer.topicsOfInterest?.join(', ') || 'general reading'}
- Recent Books: ${contextData.recentBooks?.join(', ') || 'various books'}
- Completed Books: ${contextData.completedBooks || 'several'}
- Reading Goals: ${contextData.readingGoals || 'continue learning'}

Requirements:
- Keep it encouraging and positive
- Reference their reading interests
- Suggest continuing their reading journey
- Include a call to action to read today
- Keep subject line under 50 characters
- Keep email under 200 words
- Use friendly, motivational tone

Generate:
1. Subject line
2. HTML email content
3. Plain text version`;
    }

    /**
     * Mock AI generation - replace with actual Gemini AI service
     */
    async mockAIGeneration(prompt, customer, contextData) {
        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const topics = customer.topicsOfInterest?.join(' and ') || 'reading';
        const name = customer.name || 'Reader';

        return {
            subject: `Keep reading, ${name}! 📚`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Hello ${name}! 👋</h2>
                    
                    <p>Hope you're having a great day! We noticed you've been exploring <strong>${topics}</strong> - that's fantastic!</p>
                    
                    <p>Remember, every page you read is a step forward in your learning journey. Your curiosity about ${topics} is inspiring, and we can't wait to see where your reading adventure takes you next.</p>
                    
                    <p><strong>Today's reading challenge:</strong> Open a book for just 10 minutes. That's all it takes to continue growing! 🌱</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="#" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Continue Reading</a>
                    </div>
                    
                    <p style="font-size: 14px; color: #7f8c8d;">Keep up the amazing work!<br>The Reading Team</p>
                </div>
            `,
            text: `Hello ${name}!

Hope you're having a great day! We noticed you've been exploring ${topics} - that's fantastic!

Remember, every page you read is a step forward in your learning journey. Your curiosity about ${topics} is inspiring.

Today's reading challenge: Open a book for just 10 minutes. That's all it takes to continue growing!

Keep up the amazing work!
The Reading Team`
        };
    }

    /**
     * Get next motivation email time (tomorrow morning)
     */
    getNextMotivationTime() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0); // 9 AM tomorrow
        return tomorrow;
    }
}

module.exports = DailyMotivationPipeline;