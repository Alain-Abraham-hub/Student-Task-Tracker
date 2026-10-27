# Student Academic Task Tracker (UniPulse)

A centralized full-stack application designed for students to manage academic assignments, exams, projects, and lab deadlines across courses, track progress (`Pending`, `In Progress`, `Completed`), filter by subject/priority/status, and monitor their academic workload through an interactive dashboard.

## Tech Stack
- **Frontend**: React 18, Bootstrap 5, Bootstrap Icons, Vite, `Temporal` API (`temporal-polyfill`)
- **Backend**: Node.js, Express.js REST API
- **Database**: MongoDB with Mongoose ODM

---

## Project Structure

```text
Student-Task-Tracker/
├── backend/
│   ├── models/
│   │   └── Task.js            # Mongoose schema & validation rules
│   ├── routes/
│   │   └── taskRoutes.js      # Express REST API endpoints (CRUD + /stats)
│   ├── services/
│   │   └── taskStore.js       # MongoDB / Mongoose queries & CRUD operations
│   ├── tests/
│   │   └── api.test.js        # Automated Node.js test suite for CRUD & stats
│   ├── .env.example           # Environment variable template
│   ├── package.json
│   └── server.js              # Express app & MongoDB connection bootstrap
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConfirmDeleteDialog.jsx
│   │   │   ├── DashboardSummary.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   ├── TaskFormDialog.jsx
│   │   │   └── TaskTable.jsx
│   │   ├── services/
│   │   │   └── taskApi.js     # REST API client
│   │   ├── utils/
│   │   │   └── dateUtils.js   # Temporal PlainDate & Duration calculations
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── package.json
```

---

## REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check and database connection status |
| `GET` | `/api/tasks` | List tasks (supports `?subject=`, `?priority=`, `?status=`, `?category=`, `?search=`) |
| `GET` | `/api/tasks/stats` | Aggregated workload stats, completion rate, subject breakdown, and approaching/overdue deadlines |
| `GET` | `/api/tasks/:id` | Retrieve a single academic task by ID |
| `POST` | `/api/tasks` | Create a new academic task |
| `PUT` | `/api/tasks/:id` | Update an existing task's details, deadline, priority, category, or status |
| `PATCH` | `/api/tasks/:id/status` | Quick status transition (`Pending`, `In Progress`, `Completed`) |
| `DELETE` | `/api/tasks/:id` | Delete an academic task |

---

## Getting Started

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Configure MongoDB
By default, the backend connects to `mongodb://127.0.0.1:27017/student_task_tracker`. You can configure your local MongoDB connection or a remote MongoDB Atlas URI by copying `backend/.env.example` to `backend/.env`:
```bash
cp backend/.env.example backend/.env
```

### 3. Run the Backend & Frontend
Start the Express REST API server (runs on `http://localhost:5001`):
```bash
npm run start:backend
```

In a second terminal, start the React + Vite development server (runs on `http://localhost:5173` and proxies `/api` to port `5001`):
```bash
npm run start:frontend
```
