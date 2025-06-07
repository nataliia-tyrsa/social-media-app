import express from "express";
import { protect } from "../middlewares/authMiddleware";
import { toggleFollow } from "../controllers/followController";

const router = express.Router();
router.post("/:userId", protect, toggleFollow);
export default router;