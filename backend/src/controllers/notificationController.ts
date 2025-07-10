import { Request, Response, NextFunction } from "express";
import Notification from "../models/notificationModel";
import { IUser } from "../models/userModel";
import { Types } from "mongoose";

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as IUser;
    const userId = user?._id?.toString();

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const filter: any = { user: userId };
    if (req.query.unreadOnly === "true") {
      filter.read = false;
    }

    const notifications = await Notification.find(filter)
      .populate("sender", "username avatarUrl fullName")
      .populate("post", "imageUrl content")
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 notifications

    // Transform notifications to match frontend interface
    const transformedNotifications = notifications.map(notification => ({
      _id: notification._id,
      type: notification.type,
      from: notification.sender,
      post: notification.post,
      read: notification.read,
      createdAt: notification.createdAt
    }));

    res.status(200).json(transformedNotifications);
  } catch (err) {
    console.error("Notification fetch error:", err);
    res.status(500).json({ message: "Failed to fetch notifications" });
    next(err);
  }
};

export const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const count = await Notification.countDocuments({
      to: userId,
      read: false
    });

    res.status(200).json({ count });
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as IUser;
    const userId = user?._id?.toString();
    const { notificationId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { read: true }
    );

    res.status(200).json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("Mark as read error:", err);
    res.status(500).json({ message: "Failed to mark as read" });
    next(err);
  }
};

// Helper function to create notifications
export const createNotification = async (
  userId: string | Types.ObjectId,
  senderId: string | Types.ObjectId,
  type: "like" | "comment" | "follow",
  postId?: string | Types.ObjectId
): Promise<void> => {
  try {
    // Don't create notification if user is notifying themselves
    if (userId.toString() === senderId.toString()) {
      return;
    }

    // Check if similar notification already exists (to avoid spam)
    const existingNotification = await Notification.findOne({
      user: userId,
      sender: senderId,
      type,
      post: postId || undefined,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });

    if (existingNotification) {
      return; // Don't create duplicate notifications
    }

    await Notification.create({
      user: userId,
      sender: senderId,
      type,
      post: postId || undefined,
      read: false
    });

    console.log(`Created ${type} notification for user ${userId} from ${senderId}`);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};