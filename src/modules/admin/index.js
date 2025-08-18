/**
 * Admin Interface Module
 * Exports all admin interface components
 */

module.exports = {
    authUIController: require('./controllers/authUIController'),
    dashboardController: require('./controllers/dashboardController'),
    routes: require('./routes')
};