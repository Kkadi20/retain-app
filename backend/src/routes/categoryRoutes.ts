import { Router } from "express";
import { createCategory, getCategories, updateCategory, deleteCategory } from "../controllers/categoryController";
import { protect, adminOnly } from "../middleware/authMiddleware";

const router = Router();

router.get("/", protect, getCategories);
router.post("/", protect, adminOnly, createCategory);
router.put("/:id", protect, adminOnly, updateCategory);
router.delete("/:id", protect, adminOnly, deleteCategory);

export default router;