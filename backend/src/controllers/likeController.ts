import { Request, Response, NextFunction } from "express";
import Post from "../models/postModel";
import { IUser } from "../models/userModel";

export const likePost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as IUser;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    if (post.likes.some(id => id.toString() === user._id.toString())) {
      res.status(400).json({ message: "Post already liked" });
      return;
    }

    post.likes.push(user._id);
    await post.save();
    await post.populate("likes", "username fullName");

    res.status(200).json({
      message: "Post liked successfully",
      likes: post.likes
    });
  } catch (err) {
    next(err);
  }
};

export const unlikePost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as IUser;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const likeIndex = post.likes.findIndex(id => id.toString() === user._id.toString());
    if (likeIndex === -1) {
      res.status(400).json({ message: "Post not liked yet" });
      return;
    }

    post.likes.splice(likeIndex, 1);
    await post.save();
    await post.populate("likes", "username fullName");

    res.status(200).json({
      message: "Post unliked successfully",
      likes: post.likes
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
    await post.populate("comments.author", "username fullName");

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