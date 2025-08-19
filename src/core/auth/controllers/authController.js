const authService = require('../services/authService');

/**
 * Handle admin login API endpoint
 * POST /api/auth/login
 */
const login = (req, res) => {
    console.log('Controller layer - Login attempt');
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username and password are required'
            });
        }

        // Validate credentials
        if (!authService.validateCredentials(username, password)) {
            console.log(`Failed login attempt for username: ${username}`);
            return res.status(401).json({
                success: false,
                error: 'Invalid username or password'
            });
        }

        // Generate JWT token
        const token = authService.generateToken(username);

        // Set secure cookie
        const cookieOptions = {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        };

        res.cookie('auth_token', token, cookieOptions);

        console.log(`Successful login for username: ${username}`);

        // Return success response
        res.json({
            success: true,
            message: 'Login successful',
            redirect: '/admin/dashboard'
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during login'
        });
    }
};

/**
 * Handle admin logout
 * GET /api/auth/logout
 */
const logout = (req, res) => {
    console.log('Controller layer - Logout attempt');
    try {
        // Clear the authentication cookie
        res.clearCookie('auth_token');

        console.log('User logged out successfully');

        // Redirect to login page
        res.redirect('/admin/login');

    } catch (error) {
        console.error('Logout error:', error);
        res.redirect('/admin/login');
    }
};

/**
 * Verify current authentication status
 * GET /api/auth/verify
 */
const verify = (req, res) => {
    console.log('Controller layer - Verify attempt');
    try {
        const token = req.cookies.auth_token;

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'No authentication token found'
            });
        }

        const decoded = authService.verifyToken(token);

        if (!decoded || authService.isTokenExpired(decoded)) {
            res.clearCookie('auth_token');
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token'
            });
        }

        res.json({
            success: true,
            user: {
                username: decoded.username,
                role: decoded.role
            }
        });

    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during verification'
        });
    }
};

module.exports = {
    login,
    logout,
    verify
};