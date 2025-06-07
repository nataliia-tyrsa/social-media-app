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
    const { content } = req.body;
    const { userId } = req.params;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      res.status(400).json({ message: "Message content is required" });
      return;
    }

    const message = await Message.create({ from: user._id.toString(), to: userId, text: content });

    res.status(201).json({ message });
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
    }).sort({ createdAt: 1 });

    res.status(200).json({ messages });
  } catch (err) {
    next(err);
  }
};