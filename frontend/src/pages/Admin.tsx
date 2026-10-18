// ============================================
// IMPORTS
// api: pre-configured axios instance that auto-attaches the JWT token
// ============================================
import { useState, useEffect } from "react";
import api from "../api/axios";

// --------------------------------------------
// TYPES
// Shapes of the data this page fetches from the backend.
// --------------------------------------------
interface Insights {
  totalUsers: number;
  totalExpenses: number;
  totalValue: number;
  expensesThisMonth: number;
  spendingByCategory: Record<string, number>;
  topCategories: [string, number][];
  bottomCategories: [string, number][];
  recentExpenses: { _id: string; title: string; amount: number }[];
  recentUsers: { _id: string; username: string; email: string }[];
}

interface Category {
  _id: string;
  name: string;
}

const Admin = () => {
  // --------------------------------------------
  // STATE
  // "insights" = platform-wide stats from the admin insights endpoint.
  // "categories" = the list of expense categories, for managing them.
  // "editingId"/"editValue" = tracks which category is being edited inline.
  // --------------------------------------------
  const [insights, setInsights] = useState<Insights | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // ==============================================
  // DATA FETCHING
  // ==============================================
  const fetchInsights = async () => {
    const res = await api.get("/admin/insights");
    setInsights(res.data);
  };

  const fetchCategories = async () => {
    const res = await api.get("/categories");
    setCategories(res.data);
  };

  useEffect(() => {
    fetchInsights();
    fetchCategories();
  }, []);

  // ==============================================
  // CATEGORY HANDLERS (admin-only, protected on the backend)
  // ==============================================
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/categories", { name: newCategory });
    setNewCategory("");
    fetchCategories();
  };

  const handleUpdateCategory = async (id: string) => {
    await api.put(`/categories/${id}`, { name: editValue });
    setEditingId(null);
    fetchCategories();
  };

  const handleDeleteCategory = async (id: string) => {
    await api.delete(`/categories/${id}`);
    fetchCategories();
  };

  // Show a simple loading state until insights have been fetched.
  if (!insights) return <p className="page-wrapper">Loading...</p>;

  // ==============================================
  // RENDER (JSX)
  // Same card-based layout as Home.tsx, for a consistent look.
  // ==============================================
  return (
    <div className="page-wrapper">
      <div className="card">
        <h1>Admin Dashboard</h1>
        <a href="/">Back to Home</a>
      </div>

      {/* --- Platform-wide stats --- */}
      <div className="card">
        <h2>Platform Insights</h2>
        <p>Total users: {insights.totalUsers}</p>
        <p>Total expenses recorded: {insights.totalExpenses}</p>
        <p>Total value of expenses: ${insights.totalValue}</p>
        <p>Expenses this month: {insights.expensesThisMonth}</p>
      </div>

      {/* --- Category spending breakdowns --- */}
      <div className="card">
        <h3>Top 5 Categories</h3>
        <ul>
          {insights.topCategories.map(([cat, total]) => (
            <li key={cat}>
              {cat}: ${total}
            </li>
          ))}
        </ul>

        <h3>Bottom 5 Categories</h3>
        <ul>
          {insights.bottomCategories.map(([cat, total]) => (
            <li key={cat}>
              {cat}: ${total}
            </li>
          ))}
        </ul>
      </div>

      {/* --- Recent activity --- */}
      <div className="card">
        <h3>Recently Added Expenses</h3>
        <ul>
          {insights.recentExpenses.map((exp) => (
            <li key={exp._id}>
              {exp.title} - ${exp.amount}
            </li>
          ))}
        </ul>

        <h3>Recently Registered Users</h3>
        <ul>
          {insights.recentUsers.map((u) => (
            <li key={u._id}>
              {u.username} ({u.email})
            </li>
          ))}
        </ul>
      </div>

      {/* --- Category management (create/edit/delete) --- */}
      <div className="card">
        <h2>Manage Categories</h2>
        <form onSubmit={handleAddCategory}>
          <input
            placeholder="New category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            required
          />
          <button type="submit">Add Category</button>
        </form>

        <ul>
          {categories.map((cat) => (
            <li key={cat._id}>
              {editingId === cat._id ? (
                <>
                  <input value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                  <button onClick={() => handleUpdateCategory(cat._id)}>Save</button>
                </>
              ) : (
                <>
                  {cat.name}
                  <button
                    onClick={() => {
                      setEditingId(cat._id);
                      setEditValue(cat.name);
                    }}
                  >
                    Edit
                  </button>
                  <button onClick={() => handleDeleteCategory(cat._id)}>Delete</button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Admin;