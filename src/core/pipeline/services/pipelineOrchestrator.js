const PipelineRegistry = require('./pipelineRegistry');
const pipelineExecutionService = require('../../database/services/pipelineExecutionService');

class PipelineOrchestrator {
    constructor() {
        this.runningPipelines = new Set();
    }

    /**
     * Execute a pipeline.js by name
     * @param {string} pipelineName - Name of pipeline.js to execute
     * @param {Object} options - Execution options
     * @returns {Promise<Object>} Execution result
     */
    async executePipeline(pipelineName, options = {}) {
        // Prevent duplicate executions
        if (this.runningPipelines.has(pipelineName)) {
            throw new Error(`Pipeline '${pipelineName}' is already running`);
        }

        // Validate pipeline.js exists
        if (!PipelineRegistry.hasPipeline(pipelineName)) {
            throw new Error(`Pipeline '${pipelineName}' not found`);
        }

        console.log(`🚀 Starting pipeline execution: ${pipelineName}`);
        const startTime = Date.now();

        // Create execution log
        const executionLog = await pipelineExecutionService.startExecution(pipelineName);

        // Mark as running
        this.runningPipelines.add(pipelineName);

        try {
            // Create pipeline.js instance
            const pipeline = PipelineRegistry.createPipeline(pipelineName);
            const config = PipelineRegistry.getPipelineConfig(pipelineName);

            // Execute pipeline.js
            console.log(`⚡ Executing ${config.displayName}...`);
            const result = await pipeline.runPipeline();

            // Calculate execution time
            const executionTime = Date.now() - startTime;

            // Mark execution as successful
            await pipelineExecutionService.markSuccess(
                executionLog.id,
                result.created || 0
            );

            console.log(`✅ Pipeline completed: ${pipelineName}`);
            console.log(`   - Queue items created: ${result.created || 0}`);
            console.log(`   - Failed items: ${result.failed || 0}`);
            console.log(`   - Execution time: ${(executionTime / 1000).toFixed(2)}s`);

            return {
                success: true,
                pipelineName,
                displayName: config.displayName,
                executionId: executionLog.id,
                executionTime,
                result,
                message: 'Pipeline executed successfully'
            };

        } catch (error) {
            // Calculate execution time
            const executionTime = Date.now() - startTime;

            // Mark execution as failed
            await pipelineExecutionService.markFailed(executionLog.id, error.message);

            console.error(`❌ Pipeline failed: ${pipelineName}`, error.message);

            return {
                success: false,
                pipelineName,
                executionId: executionLog.id,
                executionTime,
                error: error.message,
                message: 'Pipeline execution failed'
            };

        } finally {
            // Remove from running set
            this.runningPipelines.delete(pipelineName);
        }
    }

    /**
     * Get pipeline.js execution status
     * @param {string} pipelineName - Pipeline name
     * @returns {Object} Status information
     */
    getPipelineStatus(pipelineName) {
        if (!PipelineRegistry.hasPipeline(pipelineName)) {
            throw new Error(`Pipeline '${pipelineName}' not found`);
        }

        const config = PipelineRegistry.getPipelineConfig(pipelineName);
        const isRunning = this.runningPipelines.has(pipelineName);

        return {
            name: pipelineName,
            displayName: config.displayName,
            isRunning,
            canExecute: !isRunning,
            templateType: config.templateType,
            requiresReview: config.requiresReview
        };
    }

    /**
     * Get status of all pipelines
     * @returns {Array} Array of pipeline.js statuses
     */
    getAllPipelineStatuses() {
        return PipelineRegistry.getAvailablePipelines().map(name =>
            this.getPipelineStatus(name)
        );
    }

    /**
     * Get currently running pipelines
     * @returns {Array} Array of running pipeline.js names
     */
    getRunningPipelines() {
        return Array.from(this.runningPipelines);
    }

    /**
     * Check if any pipeline.js is running
     * @returns {boolean}
     */
    hasRunningPipelines() {
        return this.runningPipelines.size > 0;
    }

    /**
     * Get pipeline.js execution history
     * @param {string} pipelineName - Pipeline name (optional)
     * @param {number} limit - Number of results to return
     * @returns {Promise<Array>} Execution history
     */
    async getExecutionHistory(pipelineName = null, limit = 10) {
        if (pipelineName) {
            return await pipelineExecutionService.getExecutionsByPipeline(pipelineName, { limit });
        } else {
            return await pipelineExecutionService.getRecentExecutions(limit);
        }
    }

    /**
     * Get pipeline.js performance metrics
     * @param {string} pipelineName - Pipeline name
     * @returns {Promise<Object>} Performance metrics
     */
    async getPipelineMetrics(pipelineName) {
        if (!PipelineRegistry.hasPipeline(pipelineName)) {
            throw new Error(`Pipeline '${pipelineName}' not found`);
        }

        return await pipelineExecutionService.getPipelinePerformance(pipelineName);
    }

    /**
     * Get all pipeline.js metrics
     * @returns {Promise<Object>} All pipeline.js metrics
     */
    async getAllPipelineMetrics() {
        const pipelines = PipelineRegistry.getAvailablePipelines();
        const metrics = {};

        for (const pipelineName of pipelines) {
            try {
                metrics[pipelineName] = await this.getPipelineMetrics(pipelineName);
            } catch (error) {
                console.warn(`Failed to get metrics for ${pipelineName}:`, error.message);
                metrics[pipelineName] = {
                    pipelineName,
                    error: error.message
                };
            }
        }

        return metrics;
    }

    /**
     * Get pipeline.js dashboard data
     * @returns {Promise<Object>} Dashboard data
     */
    async getDashboardData() {
        const pipelines = this.getAllPipelineStatuses();
        const recentExecutions = await this.getExecutionHistory(null, 5);
        const runningCount = this.runningPipelines.size;

        // Get quick stats
        const stats = await pipelineExecutionService.getExecutionStats();
        const totalExecutions = stats.reduce((sum, stat) => sum + parseInt(stat.count), 0);
        const successfulExecutions = stats
            .filter(stat => stat.status === 'SUCCESS')
            .reduce((sum, stat) => sum + parseInt(stat.count), 0);

        return {
            pipelines,
            recentExecutions: recentExecutions.map(execution => execution.toJSON()),
            statistics: {
                totalPipelines: pipelines.length,
                runningPipelines: runningCount,
                totalExecutions,
                successfulExecutions,
                successRate: totalExecutions > 0 ?
                    ((successfulExecutions / totalExecutions) * 100).toFixed(1) : '0.0'
            },
            registryStats: PipelineRegistry.getRegistryStats()
        };
    }

    /**
     * Validate pipeline.js before execution
     * @param {string} pipelineName - Pipeline name
     * @returns {Object} Validation result
     */
    validatePipelineExecution(pipelineName) {
        const errors = [];

        if (!PipelineRegistry.hasPipeline(pipelineName)) {
            errors.push(`Pipeline '${pipelineName}' not found`);
        }

        if (this.runningPipelines.has(pipelineName)) {
            errors.push(`Pipeline '${pipelineName}' is already running`);
        }

        // Validate pipeline.js configuration
        try {
            const validation = PipelineRegistry.validatePipelineConfig(pipelineName);
            if (!validation.isValid) {
                errors.push(...validation.errors);
            }
        } catch (error) {
            errors.push(`Configuration validation failed: ${error.message}`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get execution instructions for pipeline.js
     * @param {string} pipelineName - Pipeline name
     * @returns {Object} Execution instructions
     */
    getExecutionInstructions(pipelineName) {
        return PipelineRegistry.getExecutionInstructions(pipelineName);
    }

    /**
     * Execute multiple pipelines in sequence
     * @param {Array} pipelineNames - Array of pipeline.js names
     * @returns {Promise<Array>} Array of execution results
     */
    async executePipelinesSequentially(pipelineNames) {
        const results = [];

        for (const pipelineName of pipelineNames) {
            try {
                const result = await this.executePipeline(pipelineName);
                results.push(result);

                // Small delay between executions
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                results.push({
                    success: false,
                    pipelineName,
                    error: error.message,
                    message: 'Pipeline execution failed'
                });
            }
        }

        return results;
    }
}

// Export singleton instance
module.exports = new PipelineOrchestrator();