import express from 'express';
import { validateRequest } from 'zod-express-middleware';
import { registerSchema, loginSchema, verifyEmailSchema } from '../libs/validate-schema.js';
import { registerUser, loginUser, verifyEmail, resendOTP, forgotPassword, verifyPasswordResetOTP, resetPassword, getUserInfo } from '../controllers/auth-controller.js';        
import { authenticateToken } from '../libs/auth-middleware.js';

const router = express.Router();

router.post('/register', validateRequest({
    body: registerSchema,
}), registerUser);

router.post('/login', validateRequest({
    body: loginSchema,
}), loginUser);

router.post("/verify-email", validateRequest({
    body: verifyEmailSchema,
}), verifyEmail);

router.post('/resend-otp', resendOTP);

router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyPasswordResetOTP);
router.post('/reset-password', resetPassword);

router.get('/me', authenticateToken, getUserInfo);

export default router;
