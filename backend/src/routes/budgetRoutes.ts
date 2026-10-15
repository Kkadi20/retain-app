import { Router } from "express";
import { setBudget, getBudget } from "../controllers/budgetController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

router.post("/", setBudget);
router.get("/:month", getBudget);

export default router;