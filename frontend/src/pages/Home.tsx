import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import type { Expense } from "../types";

const Home = () => {
  const { user, logout } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchExpenses = async () => {
    const res = await api.get("/expenses");
    setExpenses(res.data);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

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

  return (
    <div>
      <h1>Welcome, {user?.username}</h1>
      <button onClick={logout}>Logout</button>

      <h2>{editingId ? "Edit Expense" : "Add Expense"}</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} required />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <input placeholder="Payment Method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required />
        <button type="submit">{editingId ? "Update" : "Add"}</button>
        {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
      </form>

      <h2>Expenses</h2>
      <ul>
        {expenses.map((exp) => (
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