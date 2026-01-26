const express = require('express');
const studentController = require('../controllers/studentController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and role-based access control to all routes
router.use(authenticateToken, requireRole('STUDENT'));

/**
 * GET /student/dashboard
 * Get student dashboard with statistics
 * Requires: STUDENT role
 */
router.get('/dashboard', studentController.getDashboard);

/**
 * GET /student/enrollments
 * Get enrollment list for the student
 * Requires: STUDENT role
 */
router.get('/enrollments', studentController.getEnrollments);

/**
 * GET /student/certificates
 * Get all certificates for the student
 * Requires: STUDENT role
 */
router.get('/certificates', studentController.getCertificates);

/**
 * PUT /student/certificates/:id/toggle-sharing
 * Toggle public sharing status of a certificate
 * Requires: STUDENT role
 */
router.put('/certificates/:id/toggle-sharing', studentController.toggleCertificateSharing);

/**
 * GET /student/profile
 * Get student profile information
 * Requires: STUDENT role
 */
router.get('/profile', studentController.getProfile);

/**
 * GET /student/verification-history
 * Get verification history for student's certificates
 * Shows verification counts and recent verifications for each certificate
 * Requires: STUDENT role
 */
router.get('/verification-history', studentController.getVerificationHistory);

/**
 * GET /student/certificate-requests
 * Get certificate requests from verifiers
 * Query params: status (PENDING|APPROVED|REJECTED|EXPIRED)
 * Returns: categorized requests { pending, approved, rejected, expired }
 * Requires: STUDENT role
 */
router.get('/certificate-requests', studentController.getMyRequests);

/**
 * PUT /student/certificate-requests/:id/approve
 * Approve a verifier's certificate request
 * Creates access grant for verifier
 * Requires: STUDENT role
 */
router.put('/certificate-requests/:id/approve', studentController.approveRequest);

/**
 * PUT /student/certificate-requests/:id/reject
 * Reject a verifier's certificate request
 * Body: { rejectionReason }
 * Requires: STUDENT role
 */
router.put('/certificate-requests/:id/reject', studentController.rejectRequest);

/**
 * GET /student/granted-access
 * Get active access grants to student's certificates
 * Shows which verifiers have access to certificates
 * Requires: STUDENT role
 */
router.get('/granted-access', studentController.getGrantedAccess);

/**
 * PUT /student/granted-access/:id/revoke
 * Revoke access grant to student's certificates
 * Body: { revokeReason }
 * Requires: STUDENT role
 */
router.put('/granted-access/:id/revoke', studentController.revokeAccess);

module.exports = router;
