/**
 * Core Authentication Module
 * Exports all authentication-related components
 */

module.exports = {
    authService: require('./services/authService'),
    authController: require('./controllers/authController'),
    authMiddleware: require('./middleware/authMiddleware')
};