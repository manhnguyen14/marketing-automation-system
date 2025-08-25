const DailyMotivationPipeline = require('../pipelines/DailyMotivationPipeline');
const NewBookReleasePipeline = require('../pipelines/NewBookReleasePipeline');
const WelcomeNewMemberPipeline = require('../pipelines/WelcomeNewMemberPipeline');
/**
 * Hardcoded registry of all available pipelines
 */
const PIPELINES = {
    'DAILY_MOTIVATION': {
        displayName: 'Daily Reading Motivation',
        description: 'Motivational emails for engaged readers',
        templateType: 'ai_generated',
        requiresReview: true,
        class: DailyMotivationPipeline,
        category: 'engagement',
        frequency: 'daily',
        estimatedRecipients: '10-50 engaged readers'
    },
    'NEW_BOOK_RELEASE': {
        displayName: 'New Book Announcements',
        description: 'Announce new books to interested customers',
        templateType: 'predefined',
        requiresReview: false,
        defaultTemplateId: null, // Set dynamically when template is created
        class: NewBookReleasePipeline,
        category: 'marketing',
        frequency: 'on_demand',
        estimatedRecipients: '50-200 customers per book'
    },
    'WELCOME_NEW_MEMBER': {
        displayName: 'Welcome New Members',
        description: 'Welcome emails for new customers',
        templateType: 'predefined',
        requiresReview: false,
        defaultTemplateId: null, // Set dynamically when template is created
        class: WelcomeNewMemberPipeline,
        category: 'onboarding',
        frequency: 'daily',
        estimatedRecipients: '10-50 new customers'
    }
};

class PipelineRegistry {
    /**
     * Get all available pipeline.js names
     */
    static getAvailablePipelines() {
        return Object.keys(PIPELINES);
    }

    /**
     * Get pipeline.js configuration by name
     */
    static getPipelineConfig(pipelineName) {
        const config = PIPELINES[pipelineName];
        if (!config) {
            throw new Error(`Pipeline '${pipelineName}' not found`);
        }
        return { ...config };
    }

    /**
     * Get all pipeline.js configurations
     */
    static getAllConfigs() {
        const configs = {};
        Object.keys(PIPELINES).forEach(name => {
            configs[name] = { ...PIPELINES[name] };
        });
        return configs;
    }

    /**
     * Create pipeline.js instance by name
     */
    static createPipeline(pipelineName) {
        const config = PIPELINES[pipelineName];
        if (!config) {
            throw new Error(`Pipeline '${pipelineName}' not found`);
        }

        return new config.class();
    }

    /**
     * Check if pipeline.js exists
     */
    static hasPipeline(pipelineName) {
        return PIPELINES.hasOwnProperty(pipelineName);
    }

    /**
     * Get pipelines by category
     */
    static getPipelinesByCategory(category) {
        const pipelines = {};
        Object.keys(PIPELINES).forEach(name => {
            if (PIPELINES[name].category === category) {
                pipelines[name] = { ...PIPELINES[name] };
            }
        });
        return pipelines;
    }

    /**
     * Get pipelines by template type
     */
    static getPipelinesByTemplateType(templateType) {
        const pipelines = {};
        Object.keys(PIPELINES).forEach(name => {
            if (PIPELINES[name].templateType === templateType) {
                pipelines[name] = { ...PIPELINES[name] };
            }
        });
        return pipelines;
    }

    /**
     * Get pipelines that require review
     */
    static getReviewRequiredPipelines() {
        const pipelines = {};
        Object.keys(PIPELINES).forEach(name => {
            if (PIPELINES[name].requiresReview) {
                pipelines[name] = { ...PIPELINES[name] };
            }
        });
        return pipelines;
    }

    /**
     * Get pipeline.js summary for admin interface
     */
    static getPipelineSummary() {
        return Object.keys(PIPELINES).map(name => {
            const config = PIPELINES[name];
            return {
                name,
                displayName: config.displayName,
                description: config.description,
                templateType: config.templateType,
                requiresReview: config.requiresReview,
                category: config.category,
                frequency: config.frequency,
                estimatedRecipients: config.estimatedRecipients,
                canExecute: true // Always true for hardcoded pipelines
            };
        });
    }

    /**
     * Validate pipeline.js configuration
     */
    static validatePipelineConfig(pipelineName) {
        const config = PIPELINES[pipelineName];
        if (!config) {
            return { isValid: false, errors: [`Pipeline '${pipelineName}' not found`] };
        }

        const errors = [];

        // Required fields
        if (!config.displayName) errors.push('displayName is required');
        if (!config.description) errors.push('description is required');
        if (!config.templateType) errors.push('templateType is required');
        if (!config.class) errors.push('class is required');
        if (!config.category) errors.push('category is required');

        // Valid template types
        if (config.templateType && !['predefined', 'ai_generated'].includes(config.templateType)) {
            errors.push('templateType must be predefined or ai_generated');
        }

        // Valid categories
        const validCategories = ['engagement', 'marketing', 'retention', 'onboarding'];
        if (config.category && !validCategories.includes(config.category)) {
            errors.push(`category must be one of: ${validCategories.join(', ')}`);
        }

        // Class validation
        if (config.class) {
            try {
                const instance = new config.class();
                if (typeof instance.runPipeline !== 'function') {
                    errors.push('Pipeline class must implement runPipeline method');
                }
                if (typeof instance.createQueueItems !== 'function') {
                    errors.push('Pipeline class must implement createQueueItems method');
                }
            } catch (error) {
                errors.push(`Pipeline class instantiation failed: ${error.message}`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate all pipeline.js configurations
     */
    static validateAllConfigs() {
        const results = {};
        let hasErrors = false;

        Object.keys(PIPELINES).forEach(name => {
            const validation = PipelineRegistry.validatePipelineConfig(name);
            results[name] = validation;
            if (!validation.isValid) {
                hasErrors = true;
            }
        });

        if (hasErrors) {
            const errorSummary = Object.keys(results)
                .filter(name => !results[name].isValid)
                .map(name => `${name}: ${results[name].errors.join(', ')}`)
                .join('; ');

            throw new Error(`Pipeline validation failed: ${errorSummary}`);
        }

        return results;
    }

    /**
     * Get pipeline.js execution instructions
     */
    static getExecutionInstructions(pipelineName) {
        const config = PIPELINES[pipelineName];
        if (!config) {
            throw new Error(`Pipeline '${pipelineName}' not found`);
        }

        const instructions = {
            name: pipelineName,
            displayName: config.displayName,
            steps: []
        };

        if (config.templateType === 'predefined') {
            instructions.steps = [
                'Pipeline selects target customers',
                'Queue items created with SCHEDULED status',
                'Emails sent immediately using predefined template'
            ];
        } else {
            instructions.steps = [
                'Pipeline selects target customers',
                'Queue items created with WAIT_GENERATE_TEMPLATE status',
                'AI generates personalized templates',
                'Templates queued for admin review',
                'Admin approves/rejects templates',
                'Approved emails scheduled for sending'
            ];
        }

        return instructions;
    }

    /**
     * Get statistics about pipeline.js types
     */
    static getRegistryStats() {
        const totalPipelines = Object.keys(PIPELINES).length;
        const predefinedCount = Object.values(PIPELINES)
            .filter(config => config.templateType === 'predefined').length;
        const aiGeneratedCount = Object.values(PIPELINES)
            .filter(config => config.templateType === 'ai_generated').length;
        const reviewRequiredCount = Object.values(PIPELINES)
            .filter(config => config.requiresReview).length;

        const categories = {};
        Object.values(PIPELINES).forEach(config => {
            categories[config.category] = (categories[config.category] || 0) + 1;
        });

        return {
            totalPipelines,
            templateTypes: {
                predefined: predefinedCount,
                ai_generated: aiGeneratedCount
            },
            reviewRequired: reviewRequiredCount,
            categories
        };
    }
}

module.exports = PipelineRegistry;