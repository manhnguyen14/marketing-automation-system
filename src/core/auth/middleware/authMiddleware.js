const authService = require('../services/authService');

/**
 * Middleware to require authentication for protected routes
 * Redirects unauthenticated users to login page
 */
const requireAuth = (req, res, next) => {
    console
    const token = req.cookies.auth_token;

    if (!token) {
        console.log('No auth token found, redirecting to login');
        return res.redirect('/admin/login');
    }

    const decoded = authService.verifyToken(token);
    if (!decoded) {
        console.log('Invalid token, clearing cookie and redirecting to login');
        res.clearCookie('auth_token');
        return res.redirect('/admin/login');
    }

    // Check if token is expired
    if (authService.isTokenExpired(decoded)) {
        console.log('Token expired, clearing cookie and redirecting to login');
        res.clearCookie('auth_token');
        return res.redirect('/admin/login');
    }

    // Add user information to request object
    req.user = {
        username: decoded.username,
        role: decoded.role
    };

    next();
};

/**
 * Middleware to redirect authenticated users away from login page
 * Prevents already logged-in users from seeing login form
 */
const redirectIfAuthenticated = (req, res, next) => {
    console.log('Middleware layer - Checking if user is authenticated');
    const token = req.cookies.auth_token;

    if (token) {
        const decoded = authService.verifyToken(token);

        // If token is valid and not expired, redirect to dashboard
        if (decoded && !authService.isTokenExpired(decoded)) {
            console.log('User already authenticated, redirecting to dashboard');
            return res.redirect('/admin/dashboard');
        } else {
            // Token is invalid or expired, clear it
            res.clearCookie('auth_token');
        }
    }

    next();
};

/**
 * Middleware to extract user information without requiring authentication
 * Used for routes that need to know if user is logged in but don't require it
 */
const extractUser = (req, res, next) => {
    console.log('Middleware layer - Extracting user information');
    const token = req.cookies.auth_token;

    if (token) {
        const decoded = authService.verifyToken(token);
        if (decoded && !authService.isTokenExpired(decoded)) {
            req.user = {
                username: decoded.username,
                role: decoded.role
            };
        }
    }

    next();
};

module.exports = {
    requireAuth,
    redirectIfAuthenticated,
    extractUser
};