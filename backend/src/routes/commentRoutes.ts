import express from "express";
import { protect } from "../middlewares/authMiddleware";
import {
  addComment,
  editComment,
  deleteComment,
  toggleCommentLike,
  getCommentLikes
} from "../controllers/commentController";

const router = express.Router();

router.post("/:postId", protect, addComment);
router.put("/:postId/:commentId", protect, editComment);
router.delete("/:postId/:commentId", protect, deleteComment);
router.post("/:postId/:commentId/like", protect, toggleCommentLike);
router.get("/:postId/:commentId/likes", getCommentLikes);

export default router;