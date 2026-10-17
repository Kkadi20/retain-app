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

  //  fetches both expenses and budget.
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

  //  search, category, and payment method filters, then sorts.
  const filteredExpenses = expenses
    .filter((exp) => {
      const matchesSearch = exp.title.toLowerCase().includes(filters.search.toLowerCase());
      const matchesCategory = filters.category ? exp.category === filters.category : true;
      const matchesPayment = filters.paymentMethod ? exp.paymentMethod === filters.paymentMethod : true;
      return matchesSearch && matchesCategory && matchesPayment;
    })
    .sort((a, b) => {
      const field =
        filters.sortBy === "amount"
          ? a.amount - b.amount
          : new Date(a.date).getTime() - new Date(b.date).getTime();
      return filters.sortOrder === "asc" ? field : -field;
    });

  
  const totalSpent = useMemo(() => {
    return expenses
      .filter((exp) => exp.date.startsWith(currentMonth))
      .reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses, currentMonth]);

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

  // --------------------------------------------
  // USER DASHBOARD from the current month's expenses
  // --------------------------------------------
  const thisMonthExpenses = useMemo(
    () => expenses.filter((exp) => exp.date.startsWith(currentMonth)),
    [expenses, currentMonth]
  );

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
  // ==============================================
  return (
    <div>
      {/* --- Header / logout --- */}
      <h1>Welcome, {user?.username}</h1>
      <button onClick={logout}>Logout</button>

      {/* --- Budget section --- */}
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
      {/* --- User Dashboard --- */}
      <h2>Dashboard</h2>
      <p>Total spending this month: ${totalSpent}</p>
      <p>Remaining budget: ${remainingBudget}</p>
      <p>Highest expense: {highestExpense ? `${highestExpense.title} - $${highestExpense.amount}` : "None"}</p>

      <h3>Spending by Category</h3>
      <ul>
        {Object.entries(spendingByCategory).map(([cat, total]) => (
          <li key={cat}>{cat}: ${total}</li>
        ))}
      </ul>

      <h3>Recent Expenses</h3>
      <ul>
        {recentExpenses.map((exp) => (
          <li key={exp._id}>{exp.title} - ${exp.amount} - {exp.date.split("T")[0]}</li>
        ))}
      </ul>

      {/* --- Add/Edit expense form --- */}
      <h2>{editingId ? "Edit Expense" : "Add Expense"}</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} required />
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

      {/* --- Filter/sort controls  --- */}
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

      {/* --- Expense list --- */}
      <h2>Expenses</h2>
      <ul>
        {filteredExpenses.map((exp) => (
          <li key={exp._id}>
            {exp.title} — ${exp.amount} — {exp.category} — {exp.date.split("T")[0]} — {exp.paymentMethod}
            <button onClick={() => handleEdit(exp)}>Edit</button>
            <button onClick={() => handleDelete(exp._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;