const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { requireAuth } = require('../../auth/middleware/authMiddleware');

// Apply authentication middleware to all email routes
router.use(requireAuth);

// Email sending endpoints
router.post('/send-batch', emailController.sendBatchEmails);
router.post('/preview-template', emailController.previewTemplate);
router.post('/test-send', emailController.testEmailSending);

// Template management endpoints
router.get('/templates', emailController.getAvailableTemplates);
router.get('/templates/:templateId', emailController.getTemplateDetails);
router.post('/templates/:templateId/validate-variables', emailController.validateTemplateVariables);

// Email tracking and statistics endpoints
router.get('/batch/:batchId/stats', emailController.getBatchStats);
router.post('/delivery-status', emailController.getEmailDeliveryStatus);

// Service monitoring endpoints
router.get('/status', emailController.getServiceStatus);
router.get('/health', emailController.healthCheck);

module.exports = router;