/**
 * Authentication UI Controller
 * Handles admin interface authentication pages
 */

/**
 * Show login page
 * GET /admin/login
 */
const showLogin = (req, res) => {
    try {
        res.render('login', {
            layout: 'main',
            showNav: false,
            title: 'Admin Login'
        });
    } catch (error) {
        console.error('Error rendering login page:', error);
        res.status(500).send('Error loading login page');
    }
};

module.exports = {
    showLogin
};