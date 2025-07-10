import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/userModel";
import bcrypt from "bcryptjs";
import { createNotification } from "./notificationController";

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as IUser;
    const { fullName, username, bio, avatarUrl, currentPassword, newPassword } = req.body;

    const currentUser = await User.findById(user._id);
    if (!currentUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }


    if (username && username !== currentUser.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        res.status(400).json({ message: "Username already taken" });
        return;
      }
      currentUser.username = username;
    }


    if (fullName) currentUser.fullName = fullName;
    if (bio !== undefined) currentUser.bio = bio;
    if (avatarUrl) currentUser.avatarUrl = avatarUrl;


    if (currentPassword && newPassword) {
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
      if (!isCurrentPasswordValid) {
        res.status(400).json({ message: "Current password is incorrect" });
        return;
      }
      
      if (newPassword.length < 6) {
        res.status(400).json({ message: "New password must be at least 6 characters long" });
        return;
      }
      
      const saltRounds = 12;
      currentUser.password = await bcrypt.hash(newPassword, saltRounds);
    }

    await currentUser.save();


    const updatedUser = await User.findById(currentUser._id).select("-password");
    
    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (err) {
    next(err);
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await User.find({})
      .select("username fullName _id avatarUrl bio")
      .sort({ username: 1 });

    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

export const searchUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== "string") {
      res.status(400).json({ message: "Search query is required" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const searchRegex = new RegExp(query, "i");
    const users = await User.find({
      $or: [
        { username: searchRegex },
        { fullName: searchRegex }
      ]
    })
      .select("username fullName _id avatarUrl bio")
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

    if (String(currentUser._id) === String(targetUser._id)) {
      res.status(400).json({ message: "Cannot follow yourself" });
      return;
    }

    const isFollowing = currentUser.following.includes(targetUser._id);

    if (isFollowing) {
      currentUser.following = currentUser.following.filter(
        id => String(id) !== String(targetUser._id)
      );
      targetUser.followers = targetUser.followers.filter(
        id => String(id) !== String(currentUser._id)
      );
    } else {
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(currentUser._id);
      

      await createNotification(
        targetUser._id,
        currentUser._id,
        "follow"
      );
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
