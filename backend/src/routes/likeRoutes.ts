import express from "express";
import {
  likePost,
  toggleCommentLike,
  getCommentLikes
} from "../controllers/likeController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/posts/:postId", protect, likePost);
router.post("/comments/:commentId/like", protect, toggleCommentLike);
router.get("/comments/:commentId/likes", getCommentLikes);

export default router;