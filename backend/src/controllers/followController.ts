import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/userModel";

export const followUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const user = req.user as IUser;
    const { userId } = req.params;

    if (user._id.toString() === userId) {
      res.status(400).json({ message: "Cannot follow yourself" });
      return;
    }

    const currentUser = await User.findById(user._id);
    const targetUser = await User.findById(userId);
    
    if (!currentUser || !targetUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const isAlreadyFollowing = currentUser.following.some((id: any) => id.toString() === targetUser._id.toString());
    
    if (isAlreadyFollowing) {
      res.status(400).json({ message: "Already following this user" });
      return;
    }

    currentUser.following.push(targetUser._id);
    targetUser.followers.push(user._id);

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({
      message: "Followed successfully",
      following: currentUser.following,
      followers: targetUser.followers
    });
  } catch (err) {
    next(err);
  }
};

export const unfollowUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const user = req.user as IUser;
    const { userId } = req.params;

    const currentUser = await User.findById(user._id);
    const targetUser = await User.findById(userId);
    
    if (!currentUser || !targetUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const isFollowing = currentUser.following.some((id: any) => id.toString() === targetUser._id.toString());
    
    if (!isFollowing) {
      res.status(400).json({ message: "Not following this user" });
      return;
    }

    currentUser.following = currentUser.following.filter((id: any) => id.toString() !== userId);
    targetUser.followers = targetUser.followers.filter((id: any) => id.toString() !== user._id.toString());

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({
      message: "Unfollowed successfully",
      following: currentUser.following,
      followers: targetUser.followers
    });
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
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const user = req.user as IUser;
    const { userId } = req.params;

    if (user._id.toString() === userId) {
      res.status(400).json({ message: "Cannot follow yourself" });
      return;
    }

    const currentUser = await User.findById(user._id);
    const targetUser = await User.findById(userId);
    
    if (!currentUser || !targetUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const isFollowing = currentUser.following.some((id: any) => id.toString() === targetUser._id.toString());
    
    if (isFollowing) {
      currentUser.following = currentUser.following.filter((id: any) => id.toString() !== userId);
      targetUser.followers = targetUser.followers.filter((id: any) => id.toString() !== user._id.toString());
    } else {
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(user._id);
    }

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({
      message: isFollowing ? "Unfollowed successfully" : "Followed successfully",
      following: currentUser.following,
      followers: targetUser.followers
    });
  } catch (err) {
    next(err);
  }
};