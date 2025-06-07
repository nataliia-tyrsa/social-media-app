import express from "express";
import {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  addComment,
  editComment,
  deleteComment,
  toggleCommentLike,
  getCommentLikes
} from "../controllers/postController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/", protect, createPost);
router.get("/", getPosts);
router.get("/:id", getPost);
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);

router.post("/:id/like", protect, likePost);
router.delete("/:id/like", protect, unlikePost);

router.post("/:id/comments", protect, addComment);
router.put("/:id/comments/:commentId", protect, editComment);
router.delete("/:id/comments/:commentId", protect, deleteComment);
router.post("/:id/comments/:commentId/like", protect, toggleCommentLike);
router.get("/:id/comments/:commentId/likes", getCommentLikes);

export default router;