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
  // --------------------------------------------
  const { user, logout } = useAuth();

  // --------------------------------------------
  // EXPENSE LIST STATE
  // --------------------------------------------
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // --------------------------------------------
  // EXPENSE FORM STATE
  // --------------------------------------------
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // --------------------------------------------
  // REDUX — FILTERS
  // --------------------------------------------
  const filters = useSelector((state: RootState) => state.filters);
  const dispatch = useDispatch();

  // --------------------------------------------
  // BUDGET STATE
  // --------------------------------------------
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budget, setBudgetValue] = useState<number>(0);
  const currentMonth = new Date().toISOString().slice(0, 7);

  // ==============================================
  // DATA FETCHING FUNCTIONS
  // ==============================================
  const fetchExpenses = async () => {
    const res = await api.get("/expenses");
    setExpenses(res.data);
  };

  const fetchBudget = async () => {
    const res = await api.get(`/budgets/${currentMonth}`);
    setBudgetValue(res.data.amount || 0);
  };

  useEffect(() => {
    fetchExpenses();
    fetchBudget();
  }, []);

  // ==============================================
  // EXPENSE FORM HANDLERS
  // ==============================================
  const resetForm = () => {
    setTitle("");
    setAmount("");
    setCategory("");
    setDate("");
    setPaymentMethod("");
    setEditingId(null);
  };

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
  // ==============================================
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

  const thisMonthExpenses = useMemo(
    () => expenses.filter((exp) => exp.date.startsWith(currentMonth)),
    [expenses, currentMonth]
  );

  const totalSpent = useMemo(
    () => thisMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0),
    [thisMonthExpenses]
  );

  const remainingBudget = budget - totalSpent;

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

  // Progress bar fill %, capped at 100 so it never overflows visually.
  const budgetPercent = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;
  const progressClass =
    budgetStatus === "Over budget" ? "over-budget" : budgetStatus === "Approaching budget" ? "approaching" : "";

  // ==============================================
  // RENDER (JSX)
  // ==============================================
  return (
    <div className="page-wrapper">
      {/* --- Header / logout / admin link --- */}
      <div className="card">
        <h1>Welcome, {user?.username}</h1>
        <button onClick={logout}>Logout</button>
        {user?.role === "admin" && <a href="/admin">Admin Dashboard</a>}
      </div>

      {/* --- Budget section — stat grid + progress bar --- */}
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

        <div className="stats-grid">
          <div className="stat-box">
            <p className="stat-label">Budget</p>
            <p className="stat-value">${budget}</p>
          </div>
          <div className="stat-box">
            <p className="stat-label">Spent</p>
            <p className="stat-value">${totalSpent}</p>
          </div>
          <div className="stat-box">
            <p className="stat-label">Remaining</p>
            <p className="stat-value">${remainingBudget}</p>
          </div>
          <div className="stat-box">
            <p className="stat-label">Status</p>
            <p className="stat-value">{budgetStatus}</p>
          </div>
        </div>

        <div className="progress-track">
          <div className={`progress-fill ${progressClass}`} style={{ width: `${budgetPercent}%` }} />
        </div>
      </div>

      {/* --- User dashboard — stat grid for top numbers, lists below --- */}
      <div className="card">
        <h2>Dashboard</h2>

        <div className="stats-grid">
          <div className="stat-box">
            <p className="stat-label">Spending This Month</p>
            <p className="stat-value">${totalSpent}</p>
          </div>
          <div className="stat-box">
            <p className="stat-label">Remaining Budget</p>
            <p className="stat-value">${remainingBudget}</p>
          </div>
          <div className="stat-box">
            <p className="stat-label">Highest Expense</p>
            <p className="stat-value">
              {highestExpense ? `${highestExpense.title} ($${highestExpense.amount})` : "None"}
            </p>
          </div>
        </div>

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