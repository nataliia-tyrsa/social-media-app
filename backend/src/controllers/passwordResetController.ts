import { Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import passwordResetService from '../services/passwordResetService';


export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 3, 
  message: 'Too many password reset attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      res.status(400).json({ message: 'Email or username is required' });
      return;
    }

    const result = await passwordResetService.requestPasswordReset(identifier);
    

    res.status(200).json(result);
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const validateResetToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).json({ valid: false, message: 'Token is required' });
      return;
    }

    const result = await passwordResetService.validateResetToken(token);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ valid: false, message: 'Internal server error' });
  }
};


export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ message: 'Token and new password are required' });
      return;
    }


    if (newPassword.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters long' });
      return;
    }

    const result = await passwordResetService.resetPassword(token, newPassword);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Password reset error:', error);
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};


export const cleanupExpiredTokens = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await passwordResetService.cleanupExpiredTokens();
    res.status(200).json(result);
  } catch (error) {
    console.error('Token cleanup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 
