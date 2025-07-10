import crypto from 'crypto';
import User from '../models/userModel';
import PasswordReset from '../models/passwordResetModel';
import emailService from '../utils/emailService';

export class PasswordResetService {
  
  async requestPasswordReset(identifier: string): Promise<{ message: string }> {
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier }
      ]
    });

    if (!user) {
      return { message: 'If an account with that email exists, we sent you a reset link' };
    }

    await PasswordReset.deleteMany({ 
      user: user._id, 
      used: false 
    });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const passwordReset = new PasswordReset({
      user: user._id,
      token: resetToken,
      email: user.email,
      expiresAt,
      used: false
    });

    await passwordReset.save();

    try {
      await emailService.sendPasswordResetEmail(user.email, resetToken);
    } catch (error) {
      console.error('Failed to send reset email:', error);
      await PasswordReset.deleteOne({ _id: passwordReset._id });
      throw new Error('Failed to send reset email');
    }

    return { message: 'If an account with that email exists, we sent you a reset link' };
  }

  async validateResetToken(token: string): Promise<{ valid: boolean; email?: string; message?: string }> {
    const passwordReset = await PasswordReset.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() }
    }).populate('user');

    if (!passwordReset) {
      return { valid: false, message: 'Invalid or expired reset token' };
    }

    return { 
      valid: true, 
      email: passwordReset.email 
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const passwordReset = await PasswordReset.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() }
    }).populate('user');

    if (!passwordReset) {
      throw new Error('Invalid or expired reset token');
    }

    const user = await User.findById(passwordReset.user);
    if (!user) {
      throw new Error('User not found');
    }

    user.password = newPassword;
    await user.save();

    passwordReset.used = true;
    await passwordReset.save();

    await PasswordReset.deleteMany({
      user: user._id,
      used: false
    });

    return { message: 'Password has been reset successfully' };
  }

  async cleanupExpiredTokens(): Promise<{ message: string; deletedCount: number }> {
    const result = await PasswordReset.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { used: true }
      ]
    });

    return { 
      message: 'Expired tokens cleaned up successfully', 
      deletedCount: result.deletedCount || 0 
    };
  }
}

const passwordResetService = new PasswordResetService();
export default passwordResetService; 