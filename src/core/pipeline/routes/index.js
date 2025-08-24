const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../auth');
const pipelineController = require('../controllers/pipelineController');
const queueController = require('../controllers/queueController');

/**
 * Pipeline Management Routes
 * All routes require authentication
 */

// Pipeline execution and management
router.get('/pipelines', authMiddleware.requireAuth, pipelineController.getAllPipelines);
router.post('/pipelines/:pipelineName/execute', authMiddleware.requireAuth, pipelineController.executePipeline);
router.get('/pipelines/:pipelineName/history', authMiddleware.requireAuth, pipelineController.getPipelineHistory);
router.get('/pipelines/:pipelineName/metrics', authMiddleware.requireAuth, pipelineController.getPipelineMetrics);
router.get('/pipelines/:pipelineName/instructions', authMiddleware.requireAuth, pipelineController.getExecutionInstructions);

// Batch execution
router.post('/execute-batch', authMiddleware.requireAuth, pipelineController.executeBatch);

// Pipeline metrics and dashboard
router.get('/metrics', authMiddleware.requireAuth, pipelineController.getAllMetrics);
router.get('/dashboard', authMiddleware.requireAuth, pipelineController.getDashboard);
router.get('/status', authMiddleware.requireAuth, pipelineController.getRunningStatus);

// Email queue management
router.get('/queue', authMiddleware.requireAuth, queueController.getQueueItems);
router.get('/queue/stats', authMiddleware.requireAuth, queueController.getQueueStats);
router.get('/queue/scheduled', authMiddleware.requireAuth, queueController.getScheduledItems);
router.get('/queue/:id', authMiddleware.requireAuth, queueController.getQueueItemById);
router.put('/queue/:id/status', authMiddleware.requireAuth, queueController.updateQueueItemStatus);

// Template generation
router.post('/queue/generate-templates', authMiddleware.requireAuth, queueController.triggerTemplateGeneration);
router.get('/queue/review', authMiddleware.requireAuth, queueController.getTemplatesForReview);
router.post('/queue/review/:templateCode/approve', authMiddleware.requireAuth, queueController.approveTemplate);
router.post('/queue/review/:templateCode/reject', authMiddleware.requireAuth, queueController.rejectTemplate);

// Health check
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        module: 'pipeline',
        status: 'healthy',
        features: {
            pipelineExecution: 'ready',
            queueManagement: 'ready',
            templateGeneration: 'ready',
            templateReview: 'ready'
        },
        timestamp: new Date().toISOString()
    });
});

module.exports = router;