# Retain — Personal Expense & Budget Manager

**Live app:** https://retain-app-virid.vercel.app/
**Backend API:** https://retain-app-s6ec.onrender.com/

Retain is a full-stack web app for tracking personal expenses and managing a monthly budget, built with React, TypeScript, and a Node.js/Express backend.

---

## Tech Stack

**Frontend:**
- React + TypeScript + Vite
- React Router (routing, protected routes)
- React Context (authentication, user session, role-based access)
- Redux Toolkit (expense search, filtering, and sorting state)
- Axios (API requests)

**Backend:**
- Node.js + Express + TypeScript
- MongoDB (via Mongoose)
- JWT authentication
- bcrypt (password hashing)

**Deployment:**
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

---

## Features

### User Features
- Sign up, sign in, sign out
- Create, view, update, and delete personal expenses
- Search expenses by title, filter by category and payment method, sort by date or amount (managed with Redux)
- Set and track a monthly budget, with status (within / approaching / over budget)
- User dashboard: total spending, remaining budget, highest expense, spending by category, recent expenses

### Admin Features (role-protected)
- Create, update, and delete expense categories
- Platform insights: total users, total expenses, total value of expenses, expenses this month, top/bottom 5 categories, recently added expenses, recently registered users

### Authentication & Access Control
- JWT-based authentication
- Role-based access (`user` / `admin`)
- Protected routes using React Context — unauthenticated users are redirected to login, non-admins cannot access `/admin`
- Users can only view, edit, or delete their own expenses and budget data

---

## Local Setup Instructions

### Prerequisites
- Node.js (v18+) and npm
- A MongoDB Atlas connection string (or local MongoDB instance)

### Backend
```bash
cd backend
npm install
```
Create a `.env` file in `backend/`:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```
Run the backend:
```bash
npm run dev
```
The API runs at `http://localhost:5000`.

### Frontend
```bash
cd frontend
npm install
```
Create a `.env` file in `frontend/`:
```
VITE_API_URL=http://localhost:5000/api
```
Run the frontend:
```bash
npm run dev
```
The app runs at `http://localhost:5173`.

---

## API Overview

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Create a new account | Public |
| POST | `/api/auth/login` | Log in | Public |
| GET | `/api/expenses` | Get the logged-in user's expenses | User |
| POST | `/api/expenses` | Create an expense | User |
| GET | `/api/expenses/:id` | Get one expense | User |
| PUT | `/api/expenses/:id` | Update an expense | User |
| DELETE | `/api/expenses/:id` | Delete an expense | User |
| GET | `/api/categories` | List all categories | User |
| POST | `/api/categories` | Create a category | Admin |
| PUT | `/api/categories/:id` | Update a category | Admin |
| DELETE | `/api/categories/:id` | Delete a category | Admin |
| POST | `/api/budgets` | Set/update a monthly budget | User |
| GET | `/api/budgets/:month` | Get a budget for a given month | User |
| GET | `/api/admin/insights` | Platform-wide insights | Admin |

All protected routes require an `Authorization: Bearer <token>` header, obtained from login/register.


