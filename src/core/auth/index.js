/**
 * Core Authentication Module
 * Exports all authentication-related components
 */

// This follows the barrel export pattern - 
// index.js aggregates and re-exports the module's components for convenient access
module.exports = {
    authService: require('./services/authService'),
    authController: require('./controllers/authController'),
    authMiddleware: require('./middleware/authMiddleware')
};