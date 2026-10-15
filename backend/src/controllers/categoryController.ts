import { Response } from "express";
import Category from "../models/Category";
import { AuthRequest } from "../middleware/authMiddleware";

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    const category = await Category.create({ name });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" });
  }
};

export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" });
  }
};