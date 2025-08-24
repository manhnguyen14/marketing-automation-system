const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../../core/auth');
const pipelineUIController = require('../controllers/pipelineUIController');

/**
 * Admin Pipeline Management Routes
 * All routes require authentication
 */

// Pipeline dashboard
router.get('/pipelines', authMiddleware.requireAuth, pipelineUIController.showPipelineDashboard);

// Pipeline execution
router.post('/pipelines/:pipelineName/execute', authMiddleware.requireAuth, pipelineUIController.executePipeline);

// Queue management
router.get('/pipelines/queue', authMiddleware.requireAuth, pipelineUIController.showQueueManagement);

// Template approval workflow
router.post('/pipelines/templates/:templateId/approve', authMiddleware.requireAuth, pipelineUIController.approveTemplate);
router.post('/pipelines/templates/:templateId/reject', authMiddleware.requireAuth, pipelineUIController.rejectTemplate);

// Template generation
router.post('/pipelines/generate-templates', authMiddleware.requireAuth, pipelineUIController.triggerTemplateGeneration);

module.exports = router;