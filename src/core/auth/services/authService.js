const jwt = require('jsonwebtoken');
const config = require('../../../config');

class AuthService {
    /**
     * Validate admin credentials against environment variables
     * @param {string} username - Provided username
     * @param {string} password - Provided password
     * @returns {boolean} - True if credentials are valid
     */
    validateCredentials(username, password) {
        console.log('AuthService layer - Validating credentials...');
        // Simple validation against environment variables
        // In future phases, this could be enhanced with hashing
        return username === config.auth.username &&
            password === config.auth.password;
    }

    /**
     * Generate JWT token for authenticated user
     * @param {string} username - Authenticated username
     * @returns {string} - JWT token
     */
    generateToken(username) {
        console.log('AuthService layer - Generating token...');
        const payload = {
            username,
            role: 'admin',
            iat: Math.floor(Date.now() / 1000)
        };

        return jwt.sign(
            payload,
            config.auth.jwtSecret,
            {
                expiresIn: '24h',
                issuer: 'marketing-automation-system'
            }
        );
    }

    /**
     * Verify and decode JWT token
     * @param {string} token - JWT token to verify
     * @returns {object|null} - Decoded token payload or null if invalid
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, config.auth.jwtSecret);
        } catch (error) {
            // Token is invalid, expired, or malformed
            console.log('Token verification failed:', error.message);
            return null;
        }
    }

    /**
     * Check if token is expired
     * @param {object} decodedToken - Decoded JWT payload
     * @returns {boolean} - True if token is expired
     */
    isTokenExpired(decodedToken) {
        if (!decodedToken || !decodedToken.exp) {
            return true;
        }
        return Date.now() >= decodedToken.exp * 1000;
    }
}

module.exports = new AuthService();