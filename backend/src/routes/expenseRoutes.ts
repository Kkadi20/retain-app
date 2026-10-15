import { Router } from "express";
import { createExpense, getExpenses, getExpenseById, updateExpense, deleteExpense } from "../controllers/expenseController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

router.post("/", createExpense);
router.get("/", getExpenses);
router.get("/:id", getExpenseById);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

export default router;