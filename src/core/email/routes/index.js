const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../auth');
const emailController = require('../controllers/emailController');

/**
 * Email Service Routes
 * All routes require authentication
 */

// Email sending endpoints
router.post('/send', authMiddleware.requireAuth, emailController.sendSingleEmail);
router.post('/send-batch', authMiddleware.requireAuth, emailController.sendBatchEmails);

// Template preview
router.post('/preview', authMiddleware.requireAuth, emailController.previewTemplate);

// Queue processing endpoints
router.post('/process-queue', authMiddleware.requireAuth, emailController.processQueue);
router.get('/queue-status', authMiddleware.requireAuth, emailController.getQueueStatus);

// Statistics and monitoring
router.get('/batch/:batchId/stats', authMiddleware.requireAuth, emailController.getBatchStats);

// Testing and health
router.post('/test', authMiddleware.requireAuth, emailController.testEmailSending);
router.get('/health', emailController.getServiceHealth);

module.exports = router;