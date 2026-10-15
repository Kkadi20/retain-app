import { Response } from "express";
import Budget from "../models/Budget";
import { AuthRequest } from "../middleware/authMiddleware";

export const setBudget = async (req: AuthRequest, res: Response) => {
  try {
    const { month, amount } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { user: req.userId, month },
      { amount },
      { new: true, upsert: true }
    );

    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" });
  }
};

export const getBudget = async (req: AuthRequest, res: Response) => {
  try {
    const { month } = req.params;
    const budget = await Budget.findOne({ user: req.userId, month });
    res.json(budget || { amount: 0, month });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" });
  }
};