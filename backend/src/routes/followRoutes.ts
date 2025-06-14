import express from "express";
import { protect } from "../middlewares/authMiddleware";
import { toggleFollow, followUser, unfollowUser } from "../controllers/followController";

const router = express.Router();

// Routes that match the frontend API calls
router.post("/:userId", protect, followUser);
router.delete("/:userId", protect, unfollowUser);
router.post("/toggle/:userId", protect, toggleFollow);

export default router;