import express from "express";
import {
  createPost,
  getPosts,
  getPostById,
  getUserPosts,
  updatePost,
  deletePost,
  createSamplePosts,
  deleteTestPosts,
  deleteOtherUsersPosts
} from "../controllers/postController";
import { likePost } from "../controllers/likeController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/", protect, createPost);
router.post("/sample", protect, createSamplePosts);
router.delete("/test-posts", deleteTestPosts);
router.delete("/other-users", deleteOtherUsersPosts);
router.get("/", getPosts);
router.get("/user/:userId", getUserPosts);
router.get("/:postId", getPostById);
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);
router.post("/:id/like", protect, likePost);

export default router;