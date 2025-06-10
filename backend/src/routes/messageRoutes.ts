import express from "express";
import { protect } from "../middlewares/authMiddleware";
import { sendMessage, getMessages, getUserConversations } from "../controllers/messageController";

const router = express.Router();

router.post("/", protect, sendMessage);
router.get("/:userId", protect, getMessages);
router.get("/", protect, getUserConversations);

export default router;