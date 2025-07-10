import { Request, Response, NextFunction } from "express";
import Post from "../models/postModel";
import { IUser } from "../models/userModel";
import mongoose from "mongoose";
import { createNotification } from "./notificationController";

export const likePost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as IUser;
    const postId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({ 
        message: "Invalid post ID format. Cannot like mock or test posts.",
        postId 
      });
      return;
    }

    const post = await Post.findById(postId).populate('author', '_id');

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const alreadyLiked = post.likes.some(
      (id) => id.toString() === user._id.toString()
    );

    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (id) => id.toString() !== user._id.toString()
      );
    } else {
      post.likes.push(user._id);
      
      // Create notification for post author (only when liking, not unliking)
      if (post.author && post.author._id.toString() !== user._id.toString()) {
        await createNotification(
          post.author._id,
          user._id,
          "like",
          post._id as string
        );
      }
    }

    await post.save();

    res.status(200).json({
      message: alreadyLiked ? "Post unliked" : "Post liked",
      likes: post.likes.length,
      isLiked: !alreadyLiked,
    });
  } catch (err) {
    next(err);
  }
};

export const likeComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as IUser;
    const { postId, commentId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({ 
        message: "Invalid post ID format",
        postId 
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      res.status(400).json({ 
        message: "Invalid comment ID format",
        commentId 
      });
      return;
    }
    
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

    if (comment.likes.some(id => id.toString() === user._id.toString())) {
      res.status(400).json({ message: "Comment already liked" });
      return;
    }

    comment.likes.push(user._id);
    await post.save();

    res.status(200).json({
      message: "Comment liked successfully",
      likes: comment.likes.length
    });
  } catch (err) {
    next(err);
  }
};

export const unlikeComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as IUser;
    const { postId, commentId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({ 
        message: "Invalid post ID format",
        postId 
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      res.status(400).json({ 
        message: "Invalid comment ID format",
        commentId 
      });
      return;
    }
    
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

    const likeIndex = comment.likes.findIndex(id => id.toString() === user._id.toString());
    if (likeIndex === -1) {
      res.status(400).json({ message: "Comment not liked yet" });
      return;
    }

    comment.likes.splice(likeIndex, 1);
    await post.save();

    res.status(200).json({
      message: "Comment unliked successfully",
      likes: comment.likes.length
    });
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

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({ 
        message: "Invalid post ID format",
        postId 
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      res.status(400).json({ 
        message: "Invalid comment ID format",
        commentId 
      });
      return;
    }

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

    const likeIndex = comment.likes.findIndex(id => id.toString() === user._id.toString());
    if (likeIndex === -1) {
      comment.likes.push(user._id);
    } else {
      comment.likes.splice(likeIndex, 1);
    }

    await post.save();

    res.status(200).json({
      message: likeIndex === -1 ? "Comment liked" : "Comment unliked",
      commentId,
      likesCount: comment.likes.length,
      isLiked: likeIndex === -1
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

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({ 
        message: "Invalid post ID format",
        postId 
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      res.status(400).json({ 
        message: "Invalid comment ID format",
        commentId 
      });
      return;
    }

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