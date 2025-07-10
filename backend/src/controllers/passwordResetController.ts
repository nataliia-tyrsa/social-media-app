import { Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import passwordResetService from '../services/passwordResetService';

// Ограничение запросов на сброс пароля
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 3, // максимум 3 запроса на сброс пароля за 15 минут
  message: 'Too many password reset attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Запрос на сброс пароля
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      res.status(400).json({ message: 'Email or username is required' });
      return;
    }

    const result = await passwordResetService.requestPasswordReset(identifier);
    
    // Всегда возвращаем успешный ответ для безопасности
    res.status(200).json(result);
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Проверка валидности токена
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

// Сброс пароля
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ message: 'Token and new password are required' });
      return;
    }

    // Проверяем длину пароля
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

// Очистка истекших токенов (для административных целей)
export const cleanupExpiredTokens = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await passwordResetService.cleanupExpiredTokens();
    res.status(200).json(result);
  } catch (error) {
    console.error('Token cleanup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 