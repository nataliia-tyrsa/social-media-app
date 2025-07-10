import { Request, Response, NextFunction } from "express";
import Message from "../models/messageModel";
import User from "../models/userModel";
import { IUser } from "../models/userModel";

export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { to, text } = req.body;
    const senderId = (req as any).user.id;

    if (!text?.trim()) {
      res.status(400).json({ message: "Message text is required" });
      return;
    }

    if (!to) {
      res.status(400).json({ message: "Receiver ID is required" });
      return;
    }

    // Check if receiver exists
    const receiver = await User.findById(to);
    if (!receiver) {
      res.status(404).json({ message: "Receiver not found" });
      return;
    }

    const message = new Message({
      from: senderId,
      to: to,
      text: text.trim(),
      isRead: false
    });

    await message.save();

    // Populate sender info for response
    await message.populate("from", "username fullName avatarUrl");
    await message.populate("to", "username fullName avatarUrl");

    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
};

export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const currentUserId = (req as any).user.id;

    const messages = await Message.find({
      $or: [
        { from: currentUserId, to: userId },
        { from: userId, to: currentUserId }
      ]
    })
      .populate("from", "username fullName avatarUrl")
      .populate("to", "username fullName avatarUrl")
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { from: userId, to: currentUserId, isRead: false },
      { isRead: true }
    );

    res.status(200).json(messages);
  } catch (err) {
    next(err);
  }
};

export const getUserConversations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as IUser;

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { from: user._id.toString() },
            { to: user._id.toString() }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$from", user._id.toString()] },
              "$to",
              "$from"
            ]
          },
          lastMessage: { $first: "$$ROOT" }
        }
      }
    ]);

    res.status(200).json(conversations);
  } catch (err) {
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

    const count = await Message.countDocuments({
      to: userId,
      isRead: false
    });

    res.status(200).json({ count });
  } catch (err) {
    next(err);
  }
};

export const getUsersWithUnreadMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const usersWithUnread = await Message.aggregate([
      {
        $match: {
          to: userId,
          isRead: false
        }
      },
      {
        $group: {
          _id: "$from"
        }
      }
    ]);

    const userIds = usersWithUnread.map(item => item._id);
    res.status(200).json({ userIds });
  } catch (err) {
    next(err);
  }
};

export const getLastUnreadMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const lastUnreadMessage = await Message.findOne({
      to: userId,
      isRead: false
    })
      .populate("from", "username fullName avatarUrl")
      .sort({ createdAt: -1 });

    if (!lastUnreadMessage) {
      res.status(200).json(null);
      return;
    }

    res.status(200).json({
      userId: (lastUnreadMessage.from as any)._id,
      username: (lastUnreadMessage.from as any).username
    });
  } catch (err) {
    next(err);
  }
};