const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and admin role requirement to all routes
router.use(authenticateToken);
router.use(requireRole('ADMIN'));

/**
 * GET /api/admin/dashboard
 * Admin dashboard with system-wide statistics
 * Returns: total counts, pending approvals, today's activity
 */
router.get('/dashboard', adminController.getDashboard);

/**
 * GET /api/admin/profile
 * Admin profile information
 */
router.get('/profile', adminController.getProfile);

/**
 * GET /api/admin/users
 * List all system users with optional filters
 * Query parameters:
 * - role: STUDENT or UNIVERSITY
 * - emailVerified: true or false
 */
router.get('/users', adminController.getAllUsers);

/**
 * GET /api/admin/verification-analytics
 * Verification analytics and statistics
 * Returns: total verifications, by country, most verified certificates
 */
router.get('/verification-analytics', adminController.getVerificationAnalytics);

/**
 * GET /api/admin/certificates
 * List certificates with filters
 */
router.get('/certificates', adminController.getCertificates);

/**
 * PUT /api/admin/certificates/:id/revoke
 * Revoke a certificate (soft delete)
 */
router.put('/certificates/:id/revoke', adminController.revokeCertificate);

/**
 * GET /api/admin/verifications
 * List verification logs with filters
 */
router.get('/verifications', adminController.getVerificationLogs);

/**
 * GET /api/admin/activity-logs
 * Paginated activity logs
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 */
router.get('/activity-logs', adminController.getActivityLogs);

/**
 * Verifier Management
 */
router.get('/pending-verifiers', adminController.getPendingVerifiers);
router.put('/verifiers/:id/approve', adminController.approveVerifier);
router.put('/verifiers/:id/reject', adminController.rejectVerifier);
router.get('/verifiers', adminController.getAllVerifiers);

/**
 * Pending approvals (students, universities, verifiers)
 */
router.get('/pending-approvals', adminController.getPendingApprovals);
router.post('/approve-user', adminController.approveUser);
router.post('/reject-user', adminController.rejectUser);

module.exports = router;
