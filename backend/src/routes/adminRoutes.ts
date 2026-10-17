import { Router } from "express";
import { getAdminInsights } from "../controllers/adminController";
import { protect, adminOnly } from "../middleware/authMiddleware";

const router = Router();

router.get("/insights", protect, adminOnly, getAdminInsights);

export default router;