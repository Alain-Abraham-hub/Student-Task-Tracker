# UniPulse — Student Academic Task Tracker & Smart Study Planner

UniPulse is a centralized full-stack academic productivity platform designed for students to track deadlines, manage assignments, monitor academic workloads, visualize progress through rich infographics, and automatically generate balanced study schedules.

---

## Table of Contents
1. [Problem Statement & Proposed Solution](#problem-statement--proposed-solution)
2. [Tech Stack](#tech-stack)
3. [Architecture & Project Structure](#architecture--project-structure)
4. [Key Features & Modules](#key-features--modules)
   - [Sidebar Navigation](#1-side-navigation-bar-sidebarnavjsx)
   - [Dashboard Overview](#2-dashboard-overview-dashboardsummaryjsx)
   - [Graphs & Infographics Suite](#3-graphs--infographics-suite-workloadchartsjsx)
   - [Academic Task Manager (CRUD)](#4-academic-task-manager-filterbarjsx--tasktablejsx)
   - [Smart Study Planner & Schedule Generator](#5-smart-study-planner--schedule-generator-studyplannerjsx)
   - [Accessible Native Dialogs](#6-accessible-modals--forms-taskformdialogjsx--confirmdeletedialogjsx)
5. [REST API Documentation](#rest-api-documentation)
6. [Getting Started & Setup](#getting-started--setup)
7. [macOS Port Notice (Port 5001)](#macos-port-notice-port-5001)
8. [Automated Testing](#automated-testing)

---

## Problem Statement & Proposed Solution

* **Problem Statement**: Students often manage academic deadlines across notebooks, messaging apps, learning management systems (LMS), and multiple calendar tools. This fragmentation makes it difficult to prioritize urgent tasks, monitor study effort across courses, and avoid missed deadlines.
* **Proposed Solution**: A centralized web application providing:
  - Full CRUD task tracking across subjects, categories, and priority tiers.
  - Interactive workload analytics and real-time deadline urgency indicators.
  - A customizable algorithmic Study Planner that converts pending assignments into daily time-slotted study blocks.

---

## Tech Stack

### Frontend
- **Framework & Runtime**: React 18 (Functional components, custom hooks, memoization)
- **Styling & UI Kit**: Bootstrap 5.3 + Bootstrap Icons
- **Modern Web Standards**:
  - **CSS Layouts**: CSS Grid (`app-shell` two-column layout) & Flexbox
  - **CSS Custom Properties & `@property`**: GPU-accelerated smooth animations for circular progress indicators
  - **CSS Conic Gradients & Radial Masks**: Multi-segment status donuts and progress rings
  - **Container Queries (`@container`)**: Responsive table that collapses into accessible cards on small viewports
  - **Form Validation**: Native constraint validation paired with `:user-invalid` and ARIA synchronization
  - **Native Overlays**: HTML `<dialog>` elements with top-layer promotion and `overscroll-behavior: contain`
  - **Color-space Gradients**: Modern `in oklch` / `in oklab` gradient interpolation
- **Date & Time**: `Temporal` API (`temporal-polyfill`) for location-agnostic calendar math without time-zone drift
- **Build Tooling**: Vite 5 (Hot Module Replacement, fast build, reverse proxy)

### Backend
- **Runtime**: Node.js (v18+)
- **Web Framework**: Express.js REST API
- **Middleware**: `cors`, `dotenv`, JSON body-parser
- **Testing**: Node.js native test runner (`node:test`, `node:assert`)

### Database
- **Engine**: MongoDB
- **Object Data Modeling (ODM)**: Mongoose 8 (Strict schema definitions, enum validations, timestamps)

---

## Architecture & Project Structure

```text
Student-Task-Tracker/
├── backend/
│   ├── models/
│   │   └── Task.js                 # Mongoose task schema & validation rules
│   ├── routes/
│   │   └── taskRoutes.js           # Express REST API endpoints (CRUD + /stats)
│   ├── services/
│   │   └── taskStore.js            # MongoDB / Mongoose queries & business logic
│   ├── tests/
│   │   └── api.test.js             # Automated API integration test suite
│   ├── .env.example                # Template for environment variables
│   ├── package.json                # Backend dependencies and scripts
│   └── server.js                   # Express app initialization & MongoDB connection
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SidebarNav.jsx          # Collapsible sidebar & mobile drawer
│   │   │   ├── DashboardSummary.jsx    # Top KPI cards & urgent deadline radar
│   │   │   ├── WorkloadCharts.jsx      # Infographics, donuts, bars, & category charts
│   │   │   ├── FilterBar.jsx           # Multi-attribute search & layout switcher
│   │   │   ├── TaskTable.jsx           # Responsive task table & 3-column Kanban board
│   │   │   ├── StudyPlanner.jsx        # Algorithmic study schedule generator
│   │   │   ├── TaskFormDialog.jsx      # Accessible create/edit task modal
│   │   │   └── ConfirmDeleteDialog.jsx # Accessible delete confirmation modal
│   │   ├── services/
│   │   │   └── taskApi.js          # REST client wrapper using Fetch API
│   │   ├── utils/
│   │   │   └── dateUtils.js        # Temporal PlainDate calculations & urgency badges
│   │   ├── App.jsx                 # Main state coordinator & view router
│   │   ├── index.css               # Design tokens, CSS layout, & chart animations
│   │   └── main.jsx                # React DOM root entry point
│   ├── index.html
│   ├── package.json                # Frontend dependencies and Vite scripts
│   └── vite.config.js              # Vite server & /api reverse proxy configuration
└── package.json                    # Workspace orchestration scripts
```

---

## Key Features & Modules

### 1. Side Navigation Bar (`SidebarNav.jsx`)
- **Desktop Sidebar**: Sticky, isolated-scroll navigation bar with clean branding and section links.
- **Mobile Drawer**: Responsive off-canvas slide-out menu with backdrop dismiss.
- **Live Metadata Badges**:
  - Urgent/overdue alert counter on **Dashboard Overview**.
  - Total active tasks counter on **Task Manager**.
  - Remaining active study hours counter on **Study Planner**.
- **Sidebar Footer**: Real-time progress bar reflecting overall task completion percentage.

### 2. Dashboard Overview (`DashboardSummary.jsx`)
- **Top 4 Metric KPI Cards**:
  1. *Total Academic Tasks*: Total assignments, active study hours remaining.
  2. *Active & Pending*: Breakdown of in-progress vs. pending tasks.
  3. *Urgent Radar*: Counter for tasks overdue or due within 72 hours.
  4. *Circular Completion Rate*: Semantic `<progress class="progress-ring">` with percentage callout.
- **Approaching & Overdue Deadlines Panel**: Prioritized urgent task cards with deadline countdowns and direct edit actions.
- **Course Workload Progress**: Multi-stage progress bars displaying completed, in-progress, and pending effort per course.
- **Quick-Jump Banner**: Instant navigation shortcut to generate a study plan.

### 3. Graphs & Infographics Suite (`WorkloadCharts.jsx`)
- **Workload Status Donut Chart**: Multi-segment CSS `conic-gradient` donut visualizing task status ratios (Completed, In Progress, Pending) with central count and click-to-filter legends.
- **Study Hours Burn-Down Gauge**: Tracks completed study hours vs. total estimated workload.
- **7-Day Deadline Horizon Bar Graph**: 8-column vertical bar chart (Overdue + 7 future days) with an interactive toggle between **Task Count** and **Active Study Hours (`h`)**.
- **Priority Spectrum & Effort Distribution**: Stacked horizontal bar displaying High, Medium, and Low priority proportions, paired with one-click filter cards.
- **Category Workload Bar Chart**: Horizontal bar chart breaking down assignments by category (`Assignment`, `Exam`, `Project`, `Lab`, `Reading`, `Quiz`, `Presentation`, `Other`).
- **Accessible Data Tables**: Hidden semantic `<table>` elements provided alongside all visual charts for screen-reader users.

### 4. Academic Task Manager (`FilterBar.jsx` & `TaskTable.jsx`)
- **Full CRUD Operations**: Create new tasks, edit existing tasks, delete with confirmation, and update statuses inline.
- **Multi-Attribute Filter Bar**:
  - Live search across task title, course name, and description notes.
  - Dropdowns for Subject, Category, and Priority.
  - Quick status filter pills (`All`, `Pending`, `In Progress`, `Completed`).
- **Dual Display Modes**:
  - **Table View**: Sticky headers, status selectors, action buttons, and automatic card stacking on mobile viewports via CSS container queries.
  - **Status Board (Kanban)**: 3-column drag-free workflow board (`Pending`, `In Progress`, `Completed`) with inline status transitions.
- **Urgency Tags (`dateUtils.js`)**: Dynamic status badges (`Overdue by X days`, `Due Today`, `Due in X days`, `Upcoming`).

### 5. Smart Study Planner & Schedule Generator (`StudyPlanner.jsx`)
- **Algorithmic Schedule Generation**: Automatically divides active coursework into focused daily study sessions leading up to assignment deadlines.
- **Customizable Parameters**:
  - **Daily Study Capacity**: Slider from `1h` to `10h/day` (default `4h`).
  - **Planning Horizon**: Schedule across `7 Days`, `14 Days`, or `21 Days`.
  - **Optimization Strategy**:
    - *Urgency & Priority First (EDF)*: Prioritizes earliest deadlines and high-priority tasks.
    - *Balanced Course Interleaving*: Alternates subjects each day to avoid cognitive fatigue.
    - *Quick Wins First*: Knocks out short assignments first to build study momentum.
  - **Max Session Block**: Splits long assignments into `1.0h`, `1.5h`, or `2.0h` focus blocks (e.g. `Part 1 of 3`) with 15-minute rest breaks.
  - **Preferred Time Window**: Select `Morning (09:00)`, `Afternoon (14:00)`, or `Evening (18:00)` start times.
  - **Weekend Pace**: `Full Capacity`, `50% Lighter`, or `Rest Days (0h)`.
- **Visual Analytics**:
  - KPI summary (Total Sessions, Scheduled Hours, On-Time Sessions, Deadline Risk).
  - Daily Capacity Utilization Bar Chart (highlights overloaded days in warning amber).
  - Day-by-Day Timetable Cards with **Start**, **Done**, and **Edit** action buttons.
  - Native browser **Print Plan** support.

### 6. Accessible Modals & Forms (`TaskFormDialog.jsx` & `ConfirmDeleteDialog.jsx`)
- Built with native HTML `<dialog>` elements (`showModal()`, light-dismiss fallback, `overscroll-behavior: contain`).
- Course autocomplete suggestion support using `<datalist>`.
- Client-side validation with `:user-invalid` and dynamic `aria-invalid` synchronization.

---

## REST API Documentation

Base URL: `http://localhost:5001/api/tasks`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health check and MongoDB connection state |
| `GET` | `/api/tasks` | Retrieve tasks (supports `?subject=`, `?priority=`, `?status=`, `?category=`, `?search=`) |
| `GET` | `/api/tasks/stats` | Aggregated metrics, 7-day timeline distribution, and course breakdowns |
| `GET` | `/api/tasks/:id` | Retrieve a single task by its MongoDB ID |
| `POST` | `/api/tasks` | Create a new academic task |
| `PUT` | `/api/tasks/:id` | Update an existing task |
| `PATCH` | `/api/tasks/:id/status` | Quick status transition (`Pending`, `In Progress`, `Completed`) |
| `DELETE` | `/api/tasks/:id` | Delete an academic task |

---

## Getting Started & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher)
- [MongoDB](https://www.mongodb.com/) (Running locally or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)

### 1. Install Dependencies
From the repository root:
```bash
npm run install:all
```

### 2. Configure Environment Variables
Copy the example environment configuration:
```bash
cp backend/.env.example backend/.env
```
Default contents:
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/student_task_tracker
```
*(If using MongoDB Atlas, replace `MONGODB_URI` with your connection string).*

### 3. Start the Backend Server
```bash
npm run start:backend
```
*Runs on `http://localhost:5001`.*

### 4. Start the Frontend Development Server
In a separate terminal:
```bash
npm run start:frontend
```
*Runs on `http://localhost:5173` and proxies `/api` calls to port `5001`.*

---

## macOS Port Notice (Port 5001)

On macOS Monterey and newer, Apple's **AirPlay Receiver** service runs under `ControlCenter` and occupies port `5000` (`commplex-main`), returning `HTTP 403 Forbidden` to standard web clients.

To prevent this collision, UniPulse defaults to port **`5001`** across the backend server and the Vite reverse proxy configuration.

---

## Automated Testing

Run the automated backend integration test suite:
```bash
npm test
```
The test suite validates:
- Mongoose schema constraint validation
- Full CRUD operations (POST, GET, PUT, PATCH, DELETE)
- Multi-parameter filtering (subject, priority, status)
- Workload statistical aggregation
