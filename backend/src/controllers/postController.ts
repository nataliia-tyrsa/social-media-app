import { Types } from "mongoose";
const isValidString = (value: unknown, maxLength: number): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
import { Request, Response, NextFunction } from "express";
import Post from "../models/postModel";
import { IUser } from "../models/userModel";
import mongoose from "mongoose";

export const createPost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { content, image } = req.body;
    const user = req.user as IUser;

    if (!isValidString(content, 1000)) {
      res.status(400).json({ message: "Content is required and cannot exceed 1000 characters" });
      return;
    }

    const post = await Post.create({
      author: user._id,
      content: content.trim(),
      image: typeof image === "string" && image.trim().length > 0 ? image : undefined,
      likes: [],
      comments: []
    });

    await post.populate("author", "username fullName");

    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
};

export const getPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "username fullName")
      .populate("comments.author", "username fullName");

    const total = await Post.countDocuments();

    res.status(200).json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (err) {
    next(err);
  }
};

export const getPost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "username fullName")
      .populate("comments.author", "username fullName");

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    res.status(200).json(post);
  } catch (err) {
    next(err);
  }
};

export const updatePost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { content, image } = req.body;
    const user = req.user as IUser;
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    if (post.author.toString() !== user._id.toString()) {
      res.status(403).json({ message: "Not authorized to update this post" });
      return;
    }

    if (!isValidString(content, 1000)) {
      res.status(400).json({ message: "Content is required and cannot exceed 1000 characters" });
      return;
    }

    post.content = content.trim();
    if (typeof image === "string" && image.trim().length > 0) {
      post.image = image;
    }
    await post.save();
    await post.populate("author", "username fullName");

    res.status(200).json(post);
  } catch (err) {
    next(err);
  }
};

export const deletePost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as IUser;
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    if (post.author.toString() !== user._id.toString()) {
      res.status(403).json({ message: "Not authorized to delete this post" });
      return;
    }

    await post.deleteOne();
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export const toggleLike = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as IUser;
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const likeIndex = post.likes.indexOf(user._id);

    if (likeIndex === -1) {
      post.likes.push(user._id);
    } else {
      post.likes.splice(likeIndex, 1);
    }

    await post.save();
    res.status(200).json(post);
  } catch (err) {
    next(err);
  }
};

export const likePost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as IUser;
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    if (post.likes.includes(user._id)) {
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
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const likeIndex = post.likes.indexOf(user._id);
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
export const addComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as IUser;
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const { content } = req.body;
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      res.status(400).json({ message: "Comment content is required" });
      return;
    }

    const comment = {
      author: user._id,
      content: content.trim(),
      createdAt: new Date(),
      likes: []
    };

    post.comments.push(comment as any);
    await post.save();
    await post.populate("comments.author", "username fullName");

    res.status(201).json(post.comments[post.comments.length - 1]);
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
    const user = req.user as IUser;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const comment = post.comments.find(c => c._id.toString() === req.params.commentId);
    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    if (comment.author.toString() !== user._id.toString()) {
      res.status(403).json({ message: "Not authorized to edit this comment" });
      return;
    }

    const { content } = req.body;
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      res.status(400).json({ message: "Content is required" });
      return;
    }

    comment.content = content.trim();
    await post.save();
    res.status(200).json(comment);
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
    const user = req.user as IUser;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const comment = post.comments.find(c => c._id.toString() === req.params.commentId);
    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    if (comment.author.toString() !== user._id.toString()) {
      res.status(403).json({ message: "Not authorized to delete this comment" });
      return;
    }

    post.comments = post.comments.filter(c => c._id.toString() !== req.params.commentId);
    await post.save();

    res.status(200).json({ message: "Comment deleted successfully" });
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
    const user = req.user as IUser;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const comment = post.comments.find(c => c._id.toString() === req.params.commentId);
    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    const likes = comment.likes as Types.ObjectId[];
    const index = likes.findIndex(id => id.toString() === user._id.toString());

    if (index === -1) {
      likes.push(user._id);
    } else {
      likes.splice(index, 1);
    }

    await post.save();
    res.status(200).json(comment);
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
    const post = await Post.findById(req.params.postId)
      .populate("comments.likes", "username fullName");

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const comment = post.comments.find(c => c._id.toString() === req.params.commentId);
    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    res.status(200).json({ likes: comment.likes });
  } catch (err) {
    next(err);
  }
};