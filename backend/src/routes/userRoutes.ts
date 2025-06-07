import express from "express";
import {
  searchUsers,
  getUserProfile,
  toggleFollow
} from "../controllers/userController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/search", searchUsers);
router.get("/:userId", getUserProfile);
router.post("/:userId/follow", protect, toggleFollow);

export default router;