const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const security = require('../middleware/security');


router.post('/register', security.registerLimiter, validateRegistration, authController.register);


router.post('/login', security.loginLimiter, validateLogin, authController.login);


router.post('/admin-login', security.loginLimiter, authController.adminLogin);


router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);


router.post('/forgot-password', authController.forgotPassword);
router.get('/verify-reset-token/:token', authController.verifyResetToken);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
