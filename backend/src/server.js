require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');

// Import database to ensure connection
require('./config/database');

// Import route files
const authRoutes = require('./routes/authRoutes');
const verifyRoutes = require('./routes/verifyRoutes');
const universityRoutes = require('./routes/universityRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const verifierRoutes = require('./routes/verifierRoutes');
const profileRoutes = require('./routes/profileRoutes');

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================================
// MIDDLEWARE SETUP (in order)
// ============================================================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Parse JSON and URL-encoded request bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        logger.debug(`${req.method} ${req.path}`);
        next();
    });
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * Health check endpoint
 * Returns server status and environment information
 */
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

/**
 * Authentication routes
 * POST /api/auth/register/student
 * POST /api/auth/register/university
 * POST /api/auth/login
 */
app.use('/api/auth', authRoutes);

/**
 * Public certificate verification routes
 * POST /api/verify/certificate
 */
app.use('/api/verify', verifyRoutes);

/**
 * University operations routes (protected - requires UNIVERSITY role)
 * GET /api/university/dashboard
 * GET /api/university/students
 * POST /api/university/certificates/issue
 */
app.use('/api/university', universityRoutes);

/**
 * Student operations routes (protected - requires STUDENT role)
 * GET /api/student/dashboard
 * GET /api/student/certificates
 * PUT /api/student/certificates/:id/toggle-sharing
 */
app.use('/api/student', studentRoutes);

/**
 * Admin operations routes (protected - requires ADMIN role)
 * GET /api/admin/dashboard
 * GET /api/admin/users
 * GET /api/admin/verification-analytics
 * GET /api/admin/activity-logs
 */
app.use('/api/admin', adminRoutes);

/**
 * Verifier operations routes (protected - requires VERIFIER role)
 * GET /api/verifier/dashboard
 * GET /api/verifier/search-student
 * POST /api/verifier/request-all-certificates
 * POST /api/verifier/request-single-certificate
 * GET /api/verifier/my-requests
 * GET /api/verifier/active-access
 * GET /api/verifier/view-certificates/:studentId
 */
app.use('/api/verifier', verifierRoutes);

/**
 * Profile management routes (protected)
 * GET /api/profile
 * PUT /api/profile
 */
app.use('/api/profile', profileRoutes);

// ============================================================================
// ERROR HANDLERS
// ============================================================================

/**
 * 404 handler for undefined routes
 */
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
});

/**
 * Global error handler
 * Logs errors and returns appropriate response
 */
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err.message);
    
    // Return error response
    const statusCode = err.statusCode || 500;
    const response = {
        error: err.message || 'Internal server error'
    };
    
    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }
    
    res.status(statusCode).json(response);
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
    logger.success(`🚀 Server running on http://localhost:${PORT}`);
    logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    process.exit(0);
});

module.exports = app;
