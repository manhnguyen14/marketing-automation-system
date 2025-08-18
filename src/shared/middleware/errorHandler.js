/**
 * Global error handling middleware
 * Handles different types of errors based on request type
 */
const errorHandler = (err, req, res, next) => {
    // Log error details for debugging
    console.error('='.repeat(50));
    console.error('ERROR OCCURRED:');
    console.error('Time:', new Date().toISOString());
    console.error('Path:', req.path);
    console.error('Method:', req.method);
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    console.error('='.repeat(50));

    // Determine if this is an API request or web page request
    const isApiRequest = req.path.startsWith('/api/');

    // Handle different error types
    if (err.name === 'ValidationError') {
        // Validation errors
        if (isApiRequest) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: err.message
            });
        } else {
            return res.status(400).render('error', {
                layout: 'main',
                showNav: false,
                title: 'Validation Error',
                message: 'Invalid request data',
                details: err.message
            });
        }
    }

    if (err.name === 'UnauthorizedError' || err.status === 401) {
        // Authentication errors
        if (isApiRequest) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized access'
            });
        } else {
            return res.redirect('/admin/login');
        }
    }

    if (err.status === 404) {
        // Not found errors
        if (isApiRequest) {
            return res.status(404).json({
                success: false,
                error: 'Resource not found'
            });
        } else {
            return res.status(404).render('error', {
                layout: 'main',
                showNav: true,
                title: 'Page Not Found',
                message: 'The page you are looking for does not exist',
                details: 'Please check the URL and try again'
            });
        }
    }

    // Default server error handling
    if (isApiRequest) {
        // API routes return JSON error
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
        });
    } else {
        // Web routes render error page
        res.status(500).render('error', {
            layout: 'main',
            showNav: false,
            title: 'Server Error',
            message: 'Something went wrong on our end',
            details: process.env.NODE_ENV === 'development' ? err.message : 'Please try again later'
        });
    }
};

module.exports = errorHandler;