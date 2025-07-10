import express from "express";
import { protect } from "../middlewares/authMiddleware";
import { getNotifications, getUnreadCount, markAsRead } from "../controllers/notificationController";

const router = express.Router();

router.get("/unread-count", protect, getUnreadCount);
router.get("/", protect, getNotifications);
router.put("/:notificationId/read", protect, markAsRead);

export default router;