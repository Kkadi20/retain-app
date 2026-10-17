import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import User from "../models/User";
import Expense from "../models/Expense";

export const getAdminInsights = async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalExpenses = await Expense.countDocuments();

    const allExpenses = await Expense.find();
    const totalValue = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const expensesThisMonth = allExpenses.filter((exp) =>
      exp.date.toISOString().startsWith(currentMonth)
    ).length;

    const categoryTotals: Record<string, number> = {};
    allExpenses.forEach((exp) => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const topCategories = sortedCategories.slice(0, 5);
    const bottomCategories = sortedCategories.slice(-5).reverse();

    const recentExpenses = await Expense.find().sort({ createdAt: -1 }).limit(5);
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select("-password");

    res.json({
      totalUsers,
      totalExpenses,
      totalValue,
      expensesThisMonth,
      spendingByCategory: categoryTotals,
      topCategories,
      bottomCategories,
      recentExpenses,
      recentUsers,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" });
  }
};