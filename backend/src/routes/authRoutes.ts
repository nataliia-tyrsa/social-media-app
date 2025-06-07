import express from "express";
import {
  registerUser,
  loginUser,
  updateProfile,
} from "../controllers/authController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/register", registerUser as express.RequestHandler);
router.post("/login", loginUser as express.RequestHandler);
router.put("/profile", protect, updateProfile as express.RequestHandler);

export default router;