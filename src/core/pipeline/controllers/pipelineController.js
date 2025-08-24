const pipelineOrchestrator = require('../services/pipelineOrchestrator');
const templateGenerationService = require('../services/templateGenerationService');
const PipelineRegistry = require('../services/pipelineRegistry');

class PipelineController {
    /**
     * Get all available pipelines
     * GET /api/pipeline.js/pipelines
     */
    async getAllPipelines(req, res) {
        try {
            const pipelines = PipelineRegistry.getPipelineSummary();
            const statuses = pipelineOrchestrator.getAllPipelineStatuses();

            // Merge pipeline.js data with execution status
            const enrichedPipelines = pipelines.map(pipeline => {
                const status = statuses.find(s => s.name === pipeline.name);
                return { ...pipeline, ...status };
            });

            res.json({
                success: true,
                data: {
                    pipelines: enrichedPipelines,
                    totalCount: pipelines.length
                },
                message: 'Pipelines retrieved successfully'
            });

        } catch (error) {
            console.error('❌ Failed to get pipelines:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve pipelines',
                details: error.message
            });
        }
    }

    /**
     * Execute a pipeline.js
     * POST /api/pipeline.js/pipelines/:pipelineName/execute
     */
    async executePipeline(req, res) {
        try {
            const { pipelineName } = req.params;

            if (!pipelineName) {
                return res.status(400).json({
                    success: false,
                    error: 'Pipeline name is required'
                });
            }

            console.log(`🚀 API request to execute pipeline: ${pipelineName}`);

            // Validate pipeline.js execution
            const validation = pipelineOrchestrator.validatePipelineExecution(pipelineName);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Pipeline validation failed',
                    details: validation.errors
                });
            }

            // Execute pipeline.js
            const result = await pipelineOrchestrator.executePipeline(pipelineName);

            if (result.success) {
                res.json({
                    success: true,
                    data: result,
                    message: 'Pipeline executed successfully'
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Pipeline execution failed',
                    details: result
                });
            }

        } catch (error) {
            console.error('❌ Pipeline execution API failed:', error.message);
            res.status(500).json({
                success: false,
                error: 'Pipeline execution failed',
                details: error.message
            });
        }
    }

    /**
     * Get pipeline.js execution history
     * GET /api/pipeline.js/pipelines/:pipelineName/history
     */
    async getPipelineHistory(req, res) {
        try {
            const { pipelineName } = req.params;
            const { limit = 20 } = req.query;

            console.log(`📊 Getting execution history for pipeline: ${pipelineName}`);

            const history = await pipelineOrchestrator.getExecutionHistory(
                pipelineName,
                parseInt(limit)
            );

            res.json({
                success: true,
                data: {
                    pipelineName,
                    executions: history.map(execution => execution.toJSON()),
                    count: history.length
                },
                message: 'Pipeline history retrieved successfully'
            });

        } catch (error) {
            console.error('❌ Failed to get pipeline.js history:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve pipeline.js history',
                details: error.message
            });
        }
    }

    /**
     * Get pipeline.js metrics
     * GET /api/pipeline.js/pipelines/:pipelineName/metrics
     */
    async getPipelineMetrics(req, res) {
        try {
            const { pipelineName } = req.params;

            console.log(`📈 Getting metrics for pipeline: ${pipelineName}`);

            const metrics = await pipelineOrchestrator.getPipelineMetrics(pipelineName);

            res.json({
                success: true,
                data: metrics,
                message: 'Pipeline metrics retrieved successfully'
            });

        } catch (error) {
            console.error('❌ Failed to get pipeline.js metrics:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve pipeline.js metrics',
                details: error.message
            });
        }
    }

    /**
     * Get all pipeline.js metrics
     * GET /api/pipeline.js/metrics
     */
    async getAllMetrics(req, res) {
        try {
            console.log('📊 Getting metrics for all pipelines');

            const metrics = await pipelineOrchestrator.getAllPipelineMetrics();

            res.json({
                success: true,
                data: {
                    pipelines: metrics,
                    summary: this.calculateMetricsSummary(metrics)
                },
                message: 'All pipeline.js metrics retrieved successfully'
            });

        } catch (error) {
            console.error('❌ Failed to get all pipeline.js metrics:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve pipeline.js metrics',
                details: error.message
            });
        }
    }

    /**
     * Get pipeline.js dashboard data
     * GET /api/pipeline.js/dashboard
     */
    async getDashboard(req, res) {
        try {
            console.log('📊 Getting pipeline.js dashboard data');

            const dashboardData = await pipelineOrchestrator.getDashboardData();
            const generationStats = await templateGenerationService.getGenerationStats();

            res.json({
                success: true,
                data: {
                    ...dashboardData,
                    templateGeneration: generationStats
                },
                message: 'Dashboard data retrieved successfully'
            });

        } catch (error) {
            console.error('❌ Failed to get dashboard data:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve dashboard data',
                details: error.message
            });
        }
    }

    /**
     * Get pipeline.js execution instructions
     * GET /api/pipeline.js/pipelines/:pipelineName/instructions
     */
    async getExecutionInstructions(req, res) {
        try {
            const { pipelineName } = req.params;

            if (!PipelineRegistry.hasPipeline(pipelineName)) {
                return res.status(404).json({
                    success: false,
                    error: 'Pipeline not found'
                });
            }

            const instructions = pipelineOrchestrator.getExecutionInstructions(pipelineName);

            res.json({
                success: true,
                data: instructions,
                message: 'Execution instructions retrieved successfully'
            });

        } catch (error) {
            console.error('❌ Failed to get execution instructions:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve execution instructions',
                details: error.message
            });
        }
    }

    /**
     * Get running pipelines
     * GET /api/pipeline.js/status
     */
    async getRunningStatus(req, res) {
        try {
            const runningPipelines = pipelineOrchestrator.getRunningPipelines();
            const hasRunning = pipelineOrchestrator.hasRunningPipelines();

            res.json({
                success: true,
                data: {
                    hasRunningPipelines: hasRunning,
                    runningPipelines,
                    count: runningPipelines.length,
                    templateGenerationInProgress: templateGenerationService.isGenerationInProgress()
                },
                message: 'Pipeline status retrieved successfully'
            });

        } catch (error) {
            console.error('❌ Failed to get pipeline.js status:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve pipeline.js status',
                details: error.message
            });
        }
    }

    /**
     * Execute multiple pipelines sequentially
     * POST /api/pipeline.js/execute-batch
     */
    async executeBatch(req, res) {
        try {
            const { pipelineNames } = req.body;

            if (!pipelineNames || !Array.isArray(pipelineNames) || pipelineNames.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Pipeline names array is required'
                });
            }

            console.log(`🚀 Executing ${pipelineNames.length} pipelines sequentially`);

            const results = await pipelineOrchestrator.executePipelinesSequentially(pipelineNames);
            const successCount = results.filter(r => r.success).length;

            res.json({
                success: true,
                data: {
                    results,
                    summary: {
                        total: results.length,
                        successful: successCount,
                        failed: results.length - successCount
                    }
                },
                message: 'Batch pipeline.js execution completed'
            });

        } catch (error) {
            console.error('❌ Batch pipeline.js execution failed:', error.message);
            res.status(500).json({
                success: false,
                error: 'Batch pipeline.js execution failed',
                details: error.message
            });
        }
    }

    /**
     * Calculate summary from metrics data
     */
    calculateMetricsSummary(metrics) {
        const summary = {
            totalPipelines: Object.keys(metrics).length,
            totalExecutions: 0,
            totalSuccessful: 0,
            totalQueueItems: 0,
            avgSuccessRate: 0
        };

        const validMetrics = Object.values(metrics).filter(m => !m.error);

        if (validMetrics.length === 0) {
            return summary;
        }

        validMetrics.forEach(metric => {
            summary.totalExecutions += metric.totalExecutions || 0;
            summary.totalSuccessful += metric.successfulExecutions || 0;
            summary.totalQueueItems += metric.totalQueueItemsCreated || 0;
        });

        if (summary.totalExecutions > 0) {
            summary.avgSuccessRate = ((summary.totalSuccessful / summary.totalExecutions) * 100).toFixed(1);
        }

        return summary;
    }
}

module.exports = new PipelineController();