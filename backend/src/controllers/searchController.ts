import { Request, Response } from "express";
import User from "../models/userModel";

export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q;

    if (typeof query !== "string" || !query.trim()) {
      res.status(400).json({ message: "Query is required and must be a non-empty string" });
      return;
    }

    const users = await User.find({
      username: { $regex: query, $options: "i" },
    }).select("username fullName avatar");

    res.status(200).json(users);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Failed to search users" });
  }
};