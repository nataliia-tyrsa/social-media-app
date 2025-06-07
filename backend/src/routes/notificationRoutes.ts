import express from "express";
import { protect } from "../middlewares/authMiddleware";
import { getNotifications } from "../controllers/notificationController";

const router = express.Router();

router.get("/", protect, getNotifications);

export default router;