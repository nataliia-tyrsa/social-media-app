import { Request, Response, NextFunction } from "express";
import { IUser } from "../models/userModel";
import Message from "../models/messageModel";

export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as IUser;
    const { text, to } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      res.status(400).json({ message: "Message text is required" });
      return;
    }

    if (!to) {
      res.status(400).json({ message: "Recipient is required" });
      return;
    }

    const message = await Message.create({ 
      from: user._id.toString(), 
      to: to, 
      text: text.trim() 
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("from", "username fullName")
      .populate("to", "username fullName");

    res.status(201).json(populatedMessage);
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
    const user = req.user as IUser;
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [
        { from: user._id.toString(), to: userId },
        { from: userId, to: user._id.toString() }
      ]
    })
      .sort({ createdAt: 1 })
      .populate("from", "username fullName")
      .populate("to", "username fullName");

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