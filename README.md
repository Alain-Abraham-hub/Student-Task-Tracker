# Student Academic Task Tracker (UniPulse)

A centralized full-stack application designed for students to manage academic assignments, exams, projects, and lab deadlines across courses, track progress (`Pending`, `In Progress`, `Completed`), filter by subject/priority/status, and monitor their academic workload through an interactive dashboard.

## Tech Stack
- **Frontend**: React 18, Bootstrap 5, Bootstrap Icons, Vite, `Temporal` API (`temporal-polyfill`)
- **Backend**: Node.js, Express.js REST API
- **Database**: MongoDB with Mongoose ODM (includes an automatic local JSON persistence fallback when a local `mongod` instance is offline, while enforcing the Mongoose schema validation)

---

## Project Structure

```text
Student-Task-Tracker/
├── backend/
│   ├── models/
│   │   └── Task.js            # Mongoose schema & validation rules
│   ├── routes/
│   │   └── taskRoutes.js      # Express REST API endpoints (CRUD + /stats + /seed)
│   ├── services/
│   │   └── taskStore.js       # MongoDB / Mongoose persistence service + fallback
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
| `GET` | `/api/health` | Health check and active storage engine status |
| `GET` | `/api/tasks` | List tasks (supports `?subject=`, `?priority=`, `?status=`, `?category=`, `?search=`) |
| `GET` | `/api/tasks/stats` | Aggregated workload stats, completion rate, subject breakdown, and approaching/overdue deadlines |
| `GET` | `/api/tasks/:id` | Retrieve a single academic task by ID |
| `POST` | `/api/tasks` | Create a new academic task |
| `PUT` | `/api/tasks/:id` | Update an existing task's details, deadline, priority, category, or status |
| `PATCH` | `/api/tasks/:id/status` | Quick status transition (`Pending`, `In Progress`, `Completed`) |
| `DELETE` | `/api/tasks/:id` | Delete an academic task |
| `POST` | `/api/tasks/seed` | Reset and populate sample academic tasks |

---

## Getting Started

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Configure MongoDB (Optional)
By default, the backend connects to `mongodb://127.0.0.1:27017/student_task_tracker`. You can customize `PORT` and `MONGODB_URI` by copying `backend/.env.example` to `backend/.env`. If local MongoDB is not running, the server automatically falls back to local JSON persistence (`backend/data/tasks.json`) while still validating every document against the Mongoose `Task` model.

### 3. Run the Backend & Frontend
Start the Express REST API server (runs on `http://localhost:5001`):
```bash
npm run start:backend
```

In a second terminal, start the React + Vite development server (runs on `http://localhost:5173` and proxies `/api` to port `5001`):
```bash
npm run start:frontend
```

### 4. Run Automated API Tests
```bash
npm test
```
