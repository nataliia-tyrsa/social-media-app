import { Request, Response, NextFunction } from "express";
import User from "../models/userModel";

export const searchUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (!query || typeof query !== "string") {
      res.status(400).json({ message: "Search query is required" });
      return;
    }

    const searchRegex = new RegExp(query, "i");
    const users = await User.find({
      $or: [
        { username: searchRegex },
        { fullName: searchRegex }
      ]
    })
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({
      $or: [
        { username: searchRegex },
        { fullName: searchRegex }
      ]
    });

    res.status(200).json({
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    });
  } catch (err) {
    next(err);
  }
};

export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .populate("followers", "username fullName")
      .populate("following", "username fullName");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

export const toggleFollow = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const currentUser = await User.findById(req.user?._id);
    const targetUser = await User.findById(req.params.id);

    if (!currentUser || !targetUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (currentUser._id.toString() === targetUser._id.toString()) {
      res.status(400).json({ message: "Cannot follow yourself" });
      return;
    }

    const isFollowing = currentUser.following.includes(targetUser._id);

    if (isFollowing) {
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== targetUser._id.toString()
      );
      targetUser.followers = targetUser.followers.filter(
        id => id.toString() !== currentUser._id.toString()
      );
    } else {
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(currentUser._id);
    }

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.status(200).json({
      message: isFollowing ? "Unfollowed successfully" : "Followed successfully",
      following: !isFollowing
    });
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (typeof id !== "string" || id.trim() === "") {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: "Error fetching user" });
  }
};