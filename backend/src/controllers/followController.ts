import { Request, Response, NextFunction } from "express";
import User from "../models/userModel";

export const toggleFollow = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const user = req.user as typeof User.prototype;
    const { userId } = req.params;

    if (user._id.toString() === userId) {
      res.status(400).json({ message: "Cannot follow yourself" });
      return;
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const isFollowing = user.following.some((id: any) => id.toString() === targetUser._id.toString());
    if (isFollowing) {
      user.following = user.following.filter((id: any) => id.toString() !== userId);
      targetUser.followers = targetUser.followers.filter((id: any) => id.toString() !== user._id.toString());
    } else {
      user.following.push(targetUser._id);
      targetUser.followers.push(user._id);
    }

    await user.save();
    await targetUser.save();

    res.status(200).json({
      message: isFollowing ? "Unfollowed successfully" : "Followed successfully",
      following: user.following,
      followers: targetUser.followers
    });
  } catch (err) {
    next(err);
  }
};