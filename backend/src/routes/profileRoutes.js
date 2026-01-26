const express = require('express');
const profileController = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.post('/change-password', profileController.changePassword);
router.post('/request-email-change', profileController.requestEmailChange);
router.post('/verify-email-change', profileController.verifyEmailChange);

module.exports = router;
