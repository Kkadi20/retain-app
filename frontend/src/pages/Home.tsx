// ============================================
// IMPORTS
// Redux: for reading/updating filter state (search, category, sort, etc.)
// React: hooks for local component state and side effects
// Context: for the logged-in user and logout function
// api: pre-configured axios instance that auto-attaches the JWT token
// types: shared TypeScript shape for an Expense object
// ============================================
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store/store";
import {
  setSearch,
  setCategory as setCategoryFilter,
  setPaymentMethod as setPaymentMethodFilter,
  setSort,
} from "../store/filtersSlice";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import type { Expense } from "../types";

const Home = () => {
  // --------------------------------------------
  // AUTH
  // Comes from AuthContext — the logged-in user's info and a logout function.
  // --------------------------------------------
  const { user, logout } = useAuth();

  // --------------------------------------------
  // EXPENSE LIST STATE
  // Holds the actual array of expenses fetched from the backend.
  // --------------------------------------------
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // --------------------------------------------
  // EXPENSE FORM STATE
  // One useState per form field. "editingId" tracks whether the form
  // is in "add new" mode (null) or "editing an existing expense" mode (has an id).
  // --------------------------------------------
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // --------------------------------------------
  // REDUX — FILTERS
  // "filters" reads the current filter/sort values from the Redux store.
  // "dispatch" is how we send an action to Redux to update those values.
  // Any NEW filter-related state should be read here, not with useState.
  // --------------------------------------------
  const filters = useSelector((state: RootState) => state.filters);
  const dispatch = useDispatch();

  // --------------------------------------------
  // BUDGET STATE
  // "budgetAmount" = the input field, before it's saved.
  // "budget" = the actual saved budget amount, fetched from the backend.
  // "currentMonth" = today's year-month string, e.g. "2026-10",
  // used to match the backend's expected format for budgets/expenses.
  // --------------------------------------------
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budget, setBudgetValue] = useState<number>(0);
  const currentMonth = new Date().toISOString().slice(0, 7);

  // ==============================================
  // DATA FETCHING FUNCTIONS
  // These call the backend API. Any NEW fetch-from-backend
  // logic belongs in a function like this, not directly in the JSX.
  // ==============================================
  const fetchExpenses = async () => {
    const res = await api.get("/expenses");
    setExpenses(res.data);
  };

  const fetchBudget = async () => {
    const res = await api.get(`/budgets/${currentMonth}`);
    setBudgetValue(res.data.amount || 0);
  };

  // Runs once when the page first loads — fetches both expenses and budget.
  useEffect(() => {
    fetchExpenses();
    fetchBudget();
  }, []);

  // ==============================================
  // EXPENSE FORM HANDLERS
  // ==============================================

  // Clears the form and exits "edit mode"
  const resetForm = () => {
    setTitle("");
    setAmount("");
    setCategory("");
    setDate("");
    setPaymentMethod("");
    setEditingId(null);
  };

  // Runs when the expense form is submitted.
  // If editingId is set, it updates that expense (PUT).
  // Otherwise, it creates a brand new one (POST).
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { title, amount: Number(amount), category, date, paymentMethod };

    if (editingId) {
      await api.put(`/expenses/${editingId}`, payload);
    } else {
      await api.post("/expenses", payload);
    }
    resetForm();
    fetchExpenses();
  };

  // Pre-fills the form with an existing expense's data, for editing.
  const handleEdit = (exp: Expense) => {
    setEditingId(exp._id);
    setTitle(exp.title);
    setAmount(String(exp.amount));
    setCategory(exp.category);
    setDate(exp.date.split("T")[0]);
    setPaymentMethod(exp.paymentMethod);
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/expenses/${id}`);
    fetchExpenses();
  };

  // ==============================================
  // BUDGET FORM HANDLER
  // ==============================================
  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/budgets", { month: currentMonth, amount: Number(budgetAmount) });
    setBudgetAmount("");
    fetchBudget();
  };

  // ==============================================
  // DERIVED / COMPUTED VALUES
  // These are NOT stored in state — they're calculated fresh from
  // existing state every time the component renders.
  // ==============================================

  // Applies search, category, and payment method filters, then sorts.
  const filteredExpenses = expenses
    .filter((exp) => {
      const matchesSearch = exp.title?.toLowerCase().includes(filters.search.toLowerCase()) ?? true;
      const matchesCategory = filters.category
        ? (exp.category ?? "").toLowerCase().includes(filters.category.toLowerCase())
        : true;
      const matchesPayment = filters.paymentMethod
        ? (exp.paymentMethod ?? "").toLowerCase().includes(filters.paymentMethod.toLowerCase())
        : true;
      return matchesSearch && matchesCategory && matchesPayment;
    })
    .sort((a, b) => {
      const field =
        filters.sortBy === "amount"
          ? a.amount - b.amount
          : new Date(a.date).getTime() - new Date(b.date).getTime();
      return filters.sortOrder === "asc" ? field : -field;
    });

  // This month's expenses only — used for budget + dashboard stats.
  const thisMonthExpenses = useMemo(
    () => expenses.filter((exp) => exp.date.startsWith(currentMonth)),
    [expenses, currentMonth]
  );

  const totalSpent = useMemo(
    () => thisMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0),
    [thisMonthExpenses]
  );

  const remainingBudget = budget - totalSpent;

  // Budget status — order matters, each check only runs if the one
  // above it was false. Handles the "exactly equal to budget" edge case
  // explicitly, so it doesn't wrongly fall into "Approaching."
  const budgetStatus =
    budget === 0
      ? "No budget set"
      : totalSpent > budget
        ? "Over budget"
        : totalSpent === budget
          ? "At budget limit"
          : totalSpent >= budget * 0.8
            ? "Approaching budget"
            : "Within budget";

  // Dashboard stats: highest expense, spend-by-category, 5 most recent.
  const highestExpense = useMemo(() => {
    if (thisMonthExpenses.length === 0) return null;
    return thisMonthExpenses.reduce((max, exp) => (exp.amount > max.amount ? exp : max));
  }, [thisMonthExpenses]);

  const spendingByCategory = useMemo(() => {
    const totals: Record<string, number> = {};
    thisMonthExpenses.forEach((exp) => {
      totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
    });
    return totals;
  }, [thisMonthExpenses]);

  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [expenses]);

  // ==============================================
  // RENDER (JSX)
  // Each section is wrapped in a "card" div — this is what gives
  // the page its card-based look (white rounded box + shadow),
  // matching the design inspiration. "page-wrapper" just centers
  // everything and adds side padding.
  // ==============================================
  return (
    <div className="page-wrapper">
      {/* --- Header / logout / admin link --- */}
      <div className="card">
        <h1>Welcome, {user?.username}</h1>
        <button onClick={logout}>Logout</button>
        {user?.role === "admin" && <a href="/admin">Admin Dashboard</a>}
      </div>

      {/* --- Budget section --- */}
      <div className="card">
        <h2>Monthly Budget</h2>
        <form onSubmit={handleSetBudget}>
          <input
            placeholder="Set budget amount"
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(e.target.value)}
          />
          <button type="submit">Set Budget</button>
        </form>
        <p>Budget: ${budget}</p>
        <p>Spent this month: ${totalSpent}</p>
        <p>Remaining: ${remainingBudget}</p>
        <p>Status: {budgetStatus}</p>
      </div>

      {/* --- User dashboard --- */}
      <div className="card">
        <h2>Dashboard</h2>
        <p>Total spending this month: ${totalSpent}</p>
        <p>Remaining budget: ${remainingBudget}</p>
        <p>
          Highest expense:{" "}
          {highestExpense ? `${highestExpense.title} - $${highestExpense.amount}` : "None"}
        </p>

        <h3>Spending by Category</h3>
        <ul>
          {Object.entries(spendingByCategory).map(([cat, total]) => (
            <li key={cat}>
              {cat}: ${total}
            </li>
          ))}
        </ul>

        <h3>Recent Expenses</h3>
        <ul>
          {recentExpenses.map((exp) => (
            <li key={exp._id}>
              {exp.title} - ${exp.amount} - {exp.date.split("T")[0]}
            </li>
          ))}
        </ul>
      </div>

      {/* --- Add/Edit expense form --- */}
      <div className="card">
        <h2>{editingId ? "Edit Expense" : "Add Expense"}</h2>
        <form onSubmit={handleSubmit}>
          <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <input placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <input
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <input
            placeholder="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            required
          />
          <button type="submit">{editingId ? "Update" : "Add"}</button>
          {editingId && (
            <button type="button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>
      </div>

      {/* --- Filter/sort controls (dispatch to Redux, not local state) --- */}
      <div className="card">
        <h2>Filter & Sort</h2>
        <input
          placeholder="Search by title"
          value={filters.search}
          onChange={(e) => dispatch(setSearch(e.target.value))}
        />
        <input
          placeholder="Filter by category"
          value={filters.category}
          onChange={(e) => dispatch(setCategoryFilter(e.target.value))}
        />
        <input
          placeholder="Filter by payment method"
          value={filters.paymentMethod}
          onChange={(e) => dispatch(setPaymentMethodFilter(e.target.value))}
        />
        <select
          value={filters.sortBy}
          onChange={(e) =>
            dispatch(setSort({ sortBy: e.target.value as "date" | "amount", sortOrder: filters.sortOrder }))
          }
        >
          <option value="date">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
        </select>
        <select
          value={filters.sortOrder}
          onChange={(e) =>
            dispatch(setSort({ sortBy: filters.sortBy, sortOrder: e.target.value as "asc" | "desc" }))
          }
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      {/* --- Expense list — uses filteredExpenses, NOT the raw expenses array --- */}
      <div className="card">
        <h2>Expenses</h2>
        <table className="expense-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Amount</th>
              <th>Category</th>
              <th>Date</th>
              <th>Payment</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((exp) => (
              <tr key={exp._id}>
                <td>{exp.title}</td>
                <td>${exp.amount}</td>
                <td>{exp.category}</td>
                <td>{exp.date.split("T")[0]}</td>
                <td>{exp.paymentMethod}</td>
                <td className="actions-cell">
                  <button onClick={() => handleEdit(exp)}>Edit</button>
                  <button onClick={() => handleDelete(exp._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Home;