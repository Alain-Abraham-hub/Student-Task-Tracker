import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardSummary from './components/DashboardSummary';
import FilterBar from './components/FilterBar';
import TaskTable from './components/TaskTable';
import TaskFormDialog from './components/TaskFormDialog';
import ConfirmDeleteDialog from './components/ConfirmDeleteDialog';
import {
  fetchTasks,
  fetchStats,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  seedSampleTasks
} from './services/taskApi';

const DEFAULT_FILTERS = {
  subject: 'All',
  priority: 'All',
  status: 'All',
  category: 'All',
  search: ''
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState('table');
  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? '' : prev));
    }, 3500);
  };

  const loadData = useCallback(async (currentFilters) => {
    try {
      setErrorBanner('');
      const [tasksData, statsData] = await Promise.all([
        fetchTasks(currentFilters),
        fetchStats()
      ]);
      setTasks(tasksData);
      setStats(statsData);
    } catch (err) {
      setErrorBanner(err.message || 'Unable to connect to the backend API server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(filters);
  }, [filters, loadData]);

  // Distinct list of subjects from overall stats + current tasks
  const availableSubjects = useMemo(() => {
    const set = new Set();
    if (stats?.subjectBreakdown) {
      stats.subjectBreakdown.forEach((s) => set.add(s.subject));
    }
    tasks.forEach((t) => {
      if (t.subject) set.add(t.subject);
    });
    return Array.from(set).sort();
  }, [stats, tasks]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleOpenCreate = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleSaveTask = async (payload) => {
    setIsSubmitting(true);
    try {
      if (editingTask) {
        await updateTask(editingTask._id, payload);
        showToast(`Updated "${payload.title}"`);
      } else {
        await createTask(payload);
        showToast(`Created "${payload.title}"`);
      }
      setIsFormOpen(false);
      setEditingTask(null);
      await loadData(filters);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      showToast(`Task marked as ${newStatus}`);
      await loadData(filters);
    } catch (err) {
      setErrorBanner(err.message || 'Failed to update task status.');
    }
  };

  const handleConfirmDelete = async (taskId) => {
    setIsDeleting(true);
    try {
      const targetTitle = taskToDelete?.title || 'Task';
      await deleteTask(taskId);
      setTaskToDelete(null);
      showToast(`Deleted "${targetTitle}"`);
      await loadData(filters);
    } catch (err) {
      setErrorBanner(err.message || 'Failed to delete task.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSeedDemoData = async () => {
    try {
      setLoading(true);
      await seedSampleTasks();
      setFilters(DEFAULT_FILTERS);
      await loadData(DEFAULT_FILTERS);
      showToast('Restored sample academic workload');
    } catch (err) {
      setErrorBanner(err.message || 'Failed to seed sample tasks.');
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column bg-body-tertiary">
      {/* Top Navbar */}
      <header className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm sticky-top py-3">
        <div className="container">
          <a className="navbar-brand d-flex align-items-center gap-2 fw-bold" href="#top">
            <span className="bg-primary text-white rounded-3 px-2 py-1 d-inline-flex align-items-center">
              <i className="bi bi-mortarboard-fill fs-5" aria-hidden="true"></i>
            </span>
            <div>
              <span>UniPulse</span>
              <span className="d-none d-sm-inline text-white-50 fw-normal fs-6 ms-2">
                | Student Academic Task Tracker
              </span>
            </div>
          </a>

          <div className="d-flex align-items-center gap-2 ms-auto">
            {stats?.storageEngine && (
              <span
                className="badge bg-secondary bg-opacity-25 text-light border border-secondary d-none d-lg-inline-flex align-items-center gap-1 py-2 px-3"
                title="Active Database Storage Engine"
              >
                <i className="bi bi-database-check text-info" aria-hidden="true"></i>
                {stats.storageEngine}
              </span>
            )}

            <button
              type="button"
              className="btn btn-outline-light btn-sm px-3"
              onClick={handleSeedDemoData}
              title="Reset and reload sample academic tasks"
            >
              <i className="bi bi-arrow-counterclockwise me-1" aria-hidden="true"></i>
              Reset Sample Data
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm px-3 fw-semibold"
              onClick={handleOpenCreate}
            >
              <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
              New Academic Task
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="top" className="container py-4 flex-grow-1">
        {/* Live Toast Alert */}
        {toastMessage && (
          <div
            className="toast-banner alert alert-success shadow-sm d-flex align-items-center justify-content-between py-2 px-3 mb-3"
            role="status"
            aria-live="polite"
          >
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-check-circle-fill" aria-hidden="true"></i>
              <span className="fw-semibold small">{toastMessage}</span>
            </div>
            <button
              type="button"
              className="btn-close btn-sm"
              aria-label="Close notification"
              onClick={() => setToastMessage('')}
            />
          </div>
        )}

        {/* Error Alert */}
        {errorBanner && (
          <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
            <div>
              <i className="bi bi-exclamation-octagon-fill me-2" aria-hidden="true"></i>
              {errorBanner}
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Dismiss error"
              onClick={() => setErrorBanner('')}
            />
          </div>
        )}

        {/* Dashboard Overview & Approaching Deadlines */}
        <DashboardSummary
          stats={stats}
          onQuickFilterStatus={(st) => handleFilterChange('status', st)}
          onSelectTaskEdit={handleOpenEdit}
        />

        {/* Section Header for Task Manager */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div>
            <h1 className="h4 fw-bold mb-0 text-dark">Academic Deadlines & Assignments</h1>
            <p className="text-muted small mb-0">
              Filter by course subject, priority, category, or status to stay ahead of every deadline
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary fw-semibold shadow-sm"
            onClick={handleOpenCreate}
          >
            <i className="bi bi-plus-circle me-2" aria-hidden="true"></i>
            Add Task
          </button>
        </div>

        {/* Multi-Faceted Filter Bar */}
        <FilterBar
          filters={filters}
          subjects={availableSubjects}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalShowing={tasks.length}
        />

        {/* Task List / Board */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading academic tasks...</span>
            </div>
          </div>
        ) : (
          <TaskTable
            tasks={tasks}
            viewMode={viewMode}
            onStatusChange={handleStatusChange}
            onEditTask={handleOpenEdit}
            onRequestDelete={(task) => setTaskToDelete(task)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-top py-3 mt-5">
        <div className="container d-flex flex-wrap justify-content-between align-items-center small text-muted">
          <span>
            <strong>UniPulse</strong> — Centralized Academic Workload & Deadline Tracker
          </span>
          <span>Tech Stack: React + Bootstrap 5 • Node.js + Express REST API • MongoDB</span>
        </div>
      </footer>

      {/* Native Modal Dialogs */}
      <TaskFormDialog
        isOpen={isFormOpen}
        editingTask={editingTask}
        existingSubjects={availableSubjects}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        isSubmitting={isSubmitting}
      />

      <ConfirmDeleteDialog
        task={taskToDelete}
        onCancel={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}

