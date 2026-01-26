const express = require('express');
const verifyController = require('../controllers/verifyController');

const router = express.Router();

/**
 * POST /verify/certificate
 * Public certificate verification using Serial + Date of Birth
 * Public route - no authentication required
 */
router.post('/certificate', verifyController.verifyCertificate);

module.exports = router;
