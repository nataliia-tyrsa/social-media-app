import express from "express";
import { protect } from "../middlewares/authMiddleware";
import { sendMessage, getMessages, getUserConversations, getUnreadCount, getUsersWithUnreadMessages, getLastUnreadMessage } from "../controllers/messageController";

const router = express.Router();

router.get("/unread-count", protect, getUnreadCount);
router.get("/last-unread", protect, getLastUnreadMessage);
router.get("/users-with-unread", protect, getUsersWithUnreadMessages);
router.get("/", protect, getUserConversations);
router.post("/", protect, sendMessage);
router.get("/:userId", protect, getMessages);

export default router;