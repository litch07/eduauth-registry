const express = require('express');
const router = express.Router();
const verifierController = require('../controllers/verifierController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Apply authentication and role-based middleware to all verifier routes
router.use(authenticateToken, requireRole('VERIFIER'));

/**
 * GET /dashboard
 * Get verifier dashboard with statistics and recent requests
 * Returns: { totalRequests, pendingRequests, approvedRequests, activeAccess, recentRequests }
 */
router.get('/dashboard', verifierController.getDashboard);

/**
 * GET /profile
 * Get verifier profile information
 */
router.get('/profile', verifierController.getProfile);

/**
 * GET /search-student
 * Search for a student by NID and Date of Birth
 * Query params: nid, dateOfBirth (DD/MM/YYYY)
 * Returns: { student: {...}, hasPendingRequest: boolean }
 */
router.get('/search-student', verifierController.searchStudent);

/**
 * POST /request-all-certificates
 * Request access to all certificates of a student
 * Body: { studentId, purpose, reason }
 * Returns: { message, requestId }
 */
router.post('/request-all-certificates', verifierController.requestAllCertificates);

/**
 * POST /request-single-certificate
 * Request access to a specific certificate
 * Body: { studentId, certificateId, purpose, reason }
 * Returns: { message, requestId }
 */
router.post('/request-single-certificate', verifierController.requestSingleCertificate);

/**
 * GET /my-requests
 * Get verifier's certificate requests with pagination and filtering
 * Query params: status (PENDING|APPROVED|REJECTED|EXPIRED), page, limit
 * Returns: { requests: [...], total, page, totalPages }
 */
router.get('/my-requests', verifierController.getMyRequests);

/**
 * GET /active-access
 * Get active access grants for verifier
 * Returns: { activeAccess: [...] }
 */
router.get('/active-access', verifierController.getActiveAccess);

/**
 * GET /view-certificates/:studentId
 * View certificates of a student that verifier has access to
 * Params: studentId
 * Returns: { certificates: [...], accessExpiresAt }
 */
router.get('/view-certificates/:studentId', verifierController.viewAccessedCertificates);

/**
 * POST /save-verification
 * Save a verification history record when verifier verifies a certificate
 * Body: { certificateId }
 * Returns: { message, verificationId }
 */
router.post('/save-verification', verifierController.saveVerification);

/**
 * GET /verification-history
 * Get verifier's certificate verification history with pagination
 * Query params: page, limit
 * Returns: { verifications: [...], total, page, totalPages }
 */
router.get('/verification-history', verifierController.getVerificationHistory);

module.exports = router;
