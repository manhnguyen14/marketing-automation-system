/**
 * Dashboard Controller
 * Handles admin dashboard and main interface pages
 */

/**
 * Show admin dashboard
 * GET /admin/dashboard
 */
const showDashboard = (req, res) => {
    try {
        res.render('dashboard', {
            layout: 'main',
            showNav: true,
            title: 'Dashboard',
            user: req.user,
            currentPage: 'dashboard'
        });
    } catch (error) {
        console.error('Error rendering dashboard:', error);
        res.status(500).send('Error loading dashboard');
    }
};

module.exports = {
    showDashboard
};