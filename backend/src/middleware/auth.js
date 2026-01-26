const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Validate JWT_SECRET at module load
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    logger.warn('JWT_SECRET not set in environment variables. Using fallback (not secure for production).');
}
const SECRET_KEY = JWT_SECRET || 'fallback-secret-key-change-in-production';

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 * Attaches user data to request object
 * 
 * Expected header format: Authorization: Bearer <token>
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function authenticateToken(req, res, next) {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Extract token after "Bearer "
        
        // Check if token exists
        if (!token) {
            return res.status(401).json({
                error: 'Access token required'
            });
        }
        
        // Verify token using JWT secret
        const decoded = jwt.verify(token, SECRET_KEY);
        
        // Attach user data to request object for use in subsequent middleware/routes
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
        };
        
        // Proceed to next middleware/route handler
        next();
    } catch (error) {
        // Token verification failed (invalid, expired, or malformed)
        return res.status(403).json({
            error: 'Invalid or expired token'
        });
    }
}

/**
 * Role-based access control middleware factory
 * Returns a middleware function that checks user role
 * 
 * Usage: router.get('/admin', requireRole('ADMIN'), handler)
 * 
 * @param {string} role - Required role (e.g., 'ADMIN', 'STUDENT', 'UNIVERSITY')
 * @returns {Function} Middleware function that checks user role
 */
function requireRole(role) {
    return (req, res, next) => {
        // Check if user is authenticated (authenticateToken must be called first)
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }
        
        // Check if user has required role
        if (req.user.role !== role) {
            return res.status(403).json({
                error: `Access denied. ${role} role required.`
            });
        }
        
        // User has required role, proceed to next middleware/route handler
        next();
    };
}

module.exports = {
    authenticateToken,
    requireRole
};
