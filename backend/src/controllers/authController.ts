import { Request, Response, NextFunction } from "express";
import { rateLimit } from "express-rate-limit";
import * as authService from "../services/auth";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: "Too many login attempts, please try again after 15 minutes"
});

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};


const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email, fullName, username, password } = req.body;

  try {
    if (!email || !fullName || !username || !password) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    if (!isValidPassword(password)) {
      res.status(400).json({ 
        message: "Password must be at least 6 characters long" 
      });
      return;
    }

    const result = await authService.registerUser({ email, fullName, username, password });
    res.status(201).json(result);
  } catch (err: any) {
    if (err.message === "User already exists") {
      res.status(400).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error during registration" });
    }
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email, username, password } = req.body;
  const identifier = email || username;

  try {
    if (!identifier || !password) {
      res.status(400).json({ message: "Username/Email and password are required" });
      return;
    }

    const result = await authService.loginUser({ identifier, password });
    res.status(200).json(result);
  } catch (err: any) {
    if (err.message === "User not found") {
      res.status(401).json({ message: "User not found" });
    } else if (err.message === "Invalid credentials") {
      res.status(401).json({ message: "Invalid password" });
    } else {
      res.status(500).json({ message: "Internal server error during login" });
    }
  }
};

export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user?._id;
  const { fullName, username, email, bio, avatarUrl, currentPassword, newPassword } = req.body;

  try {
    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const updateData: any = {
      fullName,
      username,
      email,
      bio,
      avatarUrl,
      currentPassword,
      newPassword
    };

    const result = await authService.updateProfile(userId, updateData);

    res.status(200).json({ message: "Profile updated successfully", user: result });
  } catch (err: any) {
    if (err.message === "User not found") {
      res.status(404).json({ message: err.message });
    } else if (err.message === "Username already taken" || err.message === "Email already taken") {
      res.status(400).json({ message: err.message });
    } else if (err.message === "Current password is incorrect") {
      res.status(401).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Error updating profile" });
    }
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const result = await authService.getUserById(userId);
    res.status(200).json({ user: result });
  } catch (err: any) {
    res.status(500).json({ message: "Error fetching user data" });
  }
};
