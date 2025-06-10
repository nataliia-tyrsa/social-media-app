import express from "express";
import {
  getAllUsers,
  searchUsers,
  getUserProfile,
  getUserById,
  toggleFollow,
  updateProfile
} from "../controllers/userController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/", protect, getAllUsers);
router.get("/search", protect, searchUsers);
router.get("/:userId", protect, getUserById);
router.post("/:userId/follow", protect, toggleFollow);
router.put("/profile", protect, updateProfile);

export default router;