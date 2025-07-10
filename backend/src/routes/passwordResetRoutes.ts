import express from 'express';
import {
  requestPasswordReset,
  validateResetToken,
  resetPassword,
  cleanupExpiredTokens,
  passwordResetLimiter
} from '../controllers/passwordResetController';

const router = express.Router();

router.post('/request', passwordResetLimiter, requestPasswordReset);
router.get('/validate/:token', validateResetToken);
router.post('/reset', resetPassword);
router.delete('/cleanup', cleanupExpiredTokens);

export default router; 