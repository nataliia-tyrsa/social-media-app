import express from "express";
import {
  likePost,
  unlikePost,
  toggleCommentLike,
  getCommentLikes
} from "../controllers/likeController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/posts/:postId", protect, likePost);
router.delete("/posts/:postId", protect, unlikePost);
router.post("/comments/:postId/:commentId", protect, toggleCommentLike);
router.get("/comments/:postId/:commentId/likes", getCommentLikes);

export default router;