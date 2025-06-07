import express from "express";
import { protect } from "../middlewares/authMiddleware";
import { searchUsers } from "../controllers/searchController";

const router = express.Router();

router.get("/users", protect, searchUsers);

export default router;