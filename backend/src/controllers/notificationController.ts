import { Request, Response, NextFunction } from "express";
import Notification from "../models/notificationModel";
import { IUser } from "../models/userModel";

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
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .populate("fromUser", "username avatar")
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (err) {
    console.error("Notification fetch error:", err);
    res.status(500).json({ message: "Failed to fetch notifications" });
    next(err);
  }
};