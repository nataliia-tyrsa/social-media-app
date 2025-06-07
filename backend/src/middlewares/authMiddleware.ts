import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/userModel";

interface JwtPayload {
  id: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      res.status(401).json({ message: "Nicht autorisiert - Kein Token" });
      return;
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as JwtPayload;
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        res.status(401).json({ message: "Nicht autorisiert - Benutzer nicht gefunden" });
        return;
      }
      req.user = user;
      next();
    } catch {
      res.status(401).json({ message: "Nicht autorisiert - Ungültiger Token" });
      return;
    }
  } catch (error) {
    next(error);
  }
};