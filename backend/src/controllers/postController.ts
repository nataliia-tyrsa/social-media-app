import { Types } from "mongoose";
import { Request, Response } from "express";
import Post from "../models/postModel";
import { IUser } from "../models/userModel";

export const createPost = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const { content, image } = req.body;
    
    console.log('Creating post with data:', { content, image, body: req.body });
    
    if (!content && !image) {
      return res.status(400).json({ message: "Content or image is required" });
    }

    const newPost = new Post({
      author: user._id,
      content,
      image,
      likes: [],
      comments: [],
    });
    
    console.log('Post before save:', newPost);
    
    await newPost.save();
    
    const populatedPost = await Post.findById(newPost._id)
      .populate("author", "username fullName avatarUrl");
    
    console.log('Post saved successfully:', populatedPost);
    
    res.status(201).json(populatedPost);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ message: "Failed to create post", error: err });
  }
};

export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const posts = await Post.find()
      .populate("author", "username fullName avatarUrl")
      .populate("likes", "username")
      .populate("comments.author", "username fullName avatarUrl")
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch posts", error: err });
  }
};

export const getPostById = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "username fullName avatarUrl")
      .populate("likes", "username")
      .populate("comments.author", "username fullName avatarUrl");
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch post", error: err });
  }
};

export const getUserPosts = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ author: userId })
      .populate("author", "username fullName avatarUrl")
      .populate("likes", "username")
      .populate("comments.author", "username fullName avatarUrl")
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user posts", error: err });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    if (post.author.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }
    
    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete post", error: err });
  }
};

export const getPosts = getAllPosts;

export const getPost = getPostById;

export const updatePost = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const { content, image } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    if (post.author.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this post" });
    }

    post.content = content ?? post.content;
    post.image = image ?? post.image;

    await post.save();
    
    const populatedPost = await Post.findById(post._id)
      .populate("author", "username fullName avatarUrl");
    
    res.status(200).json(populatedPost);
  } catch (err) {
    res.status(500).json({ message: "Failed to update post", error: err });
  }
};

export const createSamplePosts = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    
    const samplePosts = [
      {
        author: user._id,
        content: "Schöner Sonnenaufgang heute Morgen! 🌅",
        image: "https://picsum.photos/id/1018/600/400",
        likes: [],
        comments: [],
      },
      {
        author: user._id,
        content: "Entspannender Tag am Meer 🌊",
        image: "https://picsum.photos/id/1025/600/400",
        likes: [],
        comments: [],
      },
      {
        author: user._id,
        content: "Wanderung durch den Wald 🌲",
        image: "https://picsum.photos/id/1043/600/400",
        likes: [],
        comments: [],
      },
    ];

    const createdPosts = await Post.insertMany(samplePosts);
    
    const populatedPosts = await Post.find({ _id: { $in: createdPosts.map(p => p._id) } })
      .populate("author", "username fullName avatarUrl")
      .sort({ createdAt: -1 });
    
    res.status(201).json({
      message: "Sample posts created successfully",
      posts: populatedPosts
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to create sample posts", error: err });
  }
};

export const deleteTestPosts = async (req: Request, res: Response) => {
  try {
    console.log('Deleting test posts...');
    
    // Delete posts with picsum.photos images
    const result1 = await Post.deleteMany({
      image: { $regex: 'picsum.photos' }
    });
    
    // Delete posts from jane_doe user
    const result2 = await Post.deleteMany({
      'author.username': 'jane_doe'
    });
    
    console.log(`Deleted ${result1.deletedCount} picsum posts and ${result2.deletedCount} jane_doe posts`);
    
    res.json({ 
      message: 'Test posts deleted', 
      deleted: result1.deletedCount + result2.deletedCount 
    });
  } catch (error) {
    console.error('Error deleting test posts:', error);
    res.status(500).json({ message: 'Error deleting test posts' });
  }
};

export const deleteOtherUsersPosts = async (req: Request, res: Response) => {
  try {
    console.log('Deleting posts from other users...');
    
    const result = await Post.deleteMany({
      'author.username': { $ne: 'NataliiaT' }
    });
    
    console.log(`Deleted ${result.deletedCount} posts from other users`);
    
    res.json({ 
      message: 'Other users posts deleted', 
      deleted: result.deletedCount 
    });
  } catch (error) {
    console.error('Error deleting other users posts:', error);
    res.status(500).json({ message: 'Error deleting other users posts' });
  }
};
