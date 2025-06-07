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
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  return passwordRegex.test(password);
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
        message: "Password must be at least 8 characters long and contain uppercase, lowercase letters, numbers and special characters" 
      });
      return;
    }

    const result = await authService.registerUser({ email, fullName, username, password });
    res.status(201).json(result);
  } catch (err: any) {
    if (err.message === "User already exists") {
      res.status(400).json({ message: err.message });
    } else {
      console.error("Registration error:", err);
      res.status(500).json({ message: "Internal server error during registration" });
    }
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { identifier, password } = req.body;

  try {
    if (!identifier || !password) {
      res.status(400).json({ message: "Identifier and password are required" });
      return;
    }

    const result = await authService.loginUser({ identifier, password });
    res.status(200).json(result);
  } catch (err: any) {
    if (err.message === "User not found" || err.message === "Invalid credentials") {
      res.status(401).json({ message: err.message });
    } else {
      console.error("Login error:", err);
      res.status(500).json({ message: "Internal server error during login" });
    }
  }
};

export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user?._id;
  const { fullName, username, email, currentPassword, newPassword } = req.body;

  try {
    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const result = await authService.updateProfile(userId, {
      fullName,
      username,
      email,
      currentPassword,
      newPassword
    });

    res.status(200).json({ message: "Profile updated successfully", user: result });
  } catch (err: any) {
    if (err.message === "User not found") {
      res.status(404).json({ message: err.message });
    } else if (err.message === "Username already taken" || err.message === "Email already taken") {
      res.status(400).json({ message: err.message });
    } else if (err.message === "Current password is incorrect") {
      res.status(401).json({ message: err.message });
    } else {
      console.error("Update profile error:", err);
      res.status(500).json({ message: "Error updating profile" });
    }
  }
};