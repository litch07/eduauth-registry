const express = require('express');
const universityController = require('../controllers/universityController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and role-based access control to all routes
router.use(authenticateToken, requireRole('UNIVERSITY'));

/**
 * GET /university/dashboard
 * Get university dashboard with statistics
 * Requires: UNIVERSITY role
 */
router.get('/dashboard', universityController.getDashboard);

/**
 * GET /university/students
 * Get list of enrolled students
 * Requires: UNIVERSITY role
 */
router.get('/students', universityController.getEnrolledStudents);

/**
 * GET /university/certificates
 * Get list of certificates issued by the institution
 * Requires: UNIVERSITY role
 */
router.get('/certificates', universityController.getCertificates);

/**
 * GET /university/students/search
 * Search for students to enroll (q parameter)
 * Returns students with enrollment status
 * Requires: UNIVERSITY role
 */
router.get('/students/search', universityController.searchStudent);

/**
 * GET /university/students/enrolled/search
 * Search enrolled students for issuing certificates (q parameter)
 * Requires: UNIVERSITY role
 */
router.get('/students/enrolled/search', universityController.searchEnrolledStudents);

/**
 * POST /university/students/enroll
 * Enroll a student in the institution
 * Requires: UNIVERSITY role
 */
router.post('/students/enroll', universityController.enrollStudent);

/**
 * POST /university/certificates/issue
 * Issue a new certificate to a student
 * Requires: UNIVERSITY role
 */
router.post('/certificates/issue', universityController.issueCertificate);

/**
 * GET /university/profile
 * Get university/institution profile information
 * Requires: UNIVERSITY role
 */
router.get('/profile', universityController.getProfile);

module.exports = router;
