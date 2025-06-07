import { Request, Response, NextFunction } from "express";
import Post from "../models/postModel";
import { IUser } from "../models/userModel";
import mongoose from "mongoose";

export const addComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { content } = req.body;
    const user = req.user as IUser;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    if (typeof content !== "string" || !content.trim()) {
      res.status(400).json({ message: "Comment content is required" });
      return;
    }

    if (content.length > 500) {
      res.status(400).json({ message: "Comment cannot exceed 500 characters" });
      return;
    }

    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      author: user._id,
      content: content.trim(),
      createdAt: new Date(),
      likes: []
    };

    post.comments.push(newComment);
    await post.save();
    await post.populate("comments.author", "username fullName");

    res.status(200).json(post);
  } catch (err) {
    next(err);
  }
};

export const editComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { content } = req.body;
    const { postId, commentId } = req.params;
    const user = req.user as IUser;
    const post = await Post.findById(postId);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    if (typeof content !== "string" || !content.trim()) {
      res.status(400).json({ message: "Comment content is required" });
      return;
    }

    if (content.length > 500) {
      res.status(400).json({ message: "Comment cannot exceed 500 characters" });
      return;
    }

    const comment = post.comments.find(c => c._id.toString() === commentId);
    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    if (comment.author.toString() !== user._id.toString()) {
      res.status(403).json({ message: "Not authorized to edit this comment" });
      return;
    }

    comment.content = content.trim();
    await post.save();
    await post.populate("comments.author", "username fullName");

    res.status(200).json(post);
  } catch (err) {
    next(err);
  }
};

export const deleteComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { postId, commentId } = req.params;
    const user = req.user as IUser;
    const post = await Post.findById(postId);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const comment = post.comments.find(c => c._id.toString() === commentId);
    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    if (comment.author.toString() !== user._id.toString()) {
      res.status(403).json({ message: "Not authorized to delete this comment" });
      return;
    }

    post.comments = post.comments.filter(c => c._id.toString() !== commentId);
    await post.save();
    await post.populate("comments.author", "username fullName");

    res.status(200).json(post);
  } catch (err) {
    next(err);
  }
};

export const toggleCommentLike = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { postId, commentId } = req.params;
    const user = req.user as IUser;
    const post = await Post.findById(postId);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const comment = post.comments.find(c => c._id.toString() === commentId);
    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    const likeIndex = comment.likes.indexOf(user._id);
    if (likeIndex === -1) {
      comment.likes.push(user._id);
    } else {
      comment.likes.splice(likeIndex, 1);
    }

    await post.save();

    res.status(200).json({
      message: likeIndex === -1 ? "Comment liked" : "Comment unliked",
      likes: comment.likes.length
    });
  } catch (err) {
    next(err);
  }
};

export const getCommentLikes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { postId, commentId } = req.params;
    const post = await Post.findById(postId)
      .populate("comments.likes", "username fullName");

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const comment = post.comments.find(c => c._id.toString() === commentId);
    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    res.status(200).json({
      likes: comment.likes,
      totalLikes: comment.likes.length
    });
  } catch (err) {
    next(err);
  }
};