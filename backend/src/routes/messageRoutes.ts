import express from "express";
import { protect } from "../middlewares/authMiddleware";
import { sendMessage, getMessages } from "../controllers/messageController";

const router = express.Router();

router.post("/:userId", protect, sendMessage);
router.get("/:userId", protect, getMessages);

export default router;