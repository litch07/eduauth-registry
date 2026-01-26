const express = require('express');
const authController = require('../controllers/authController');
const profileController = require('../controllers/profileController');

const router = express.Router();

/**
 * POST /auth/register/student
 * Register a new student account
 * Public route - no authentication required
 */
router.post('/register/student', authController.registerStudent);

/**
 * POST /auth/register/university
 * Register a new university account
 * Public route - no authentication required
 */
router.post('/register/university', authController.registerUniversity);

/**
 * POST /auth/register/verifier
 * Register a new verifier account
 * Public route - no authentication required
 * Requires admin approval before verification access
 */
router.post('/register/verifier', authController.registerVerifier);

/**
 * POST /auth/login
 * Login with email and password
 * Returns JWT token for authenticated user
 * Public route - no authentication required
 */
router.post('/login', authController.login);

/**
 * POST /auth/send-verification-code
 * Send email verification code
 * Public route - no authentication required
 */
router.post('/send-verification-code', authController.sendVerificationCode);

/**
 * POST /auth/verify-email-code
 * Verify email using code
 * Public route - no authentication required
 */
router.post('/verify-email-code', authController.verifyEmailCode);

/**
 * POST /auth/forgot-password
 * Request password reset link
 * Public route
 */
router.post('/forgot-password', profileController.requestPasswordReset);

/**
 * POST /auth/reset-password
 * Reset password with token
 * Public route
 */
router.post('/reset-password', profileController.resetPassword);

/**
 * POST /auth/admin/login
 * Admin login with email and password
 * Returns JWT token with ADMIN role
 * Public route - no authentication required
 */
router.post('/admin/login', authController.adminLogin);

module.exports = router;
