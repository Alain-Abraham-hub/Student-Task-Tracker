import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SidebarNav from './components/SidebarNav';
import DashboardSummary from './components/DashboardSummary';
import WorkloadCharts from './components/WorkloadCharts';
import FilterBar from './components/FilterBar';
import TaskTable from './components/TaskTable';
import StudyPlanner from './components/StudyPlanner';
import TaskFormDialog from './components/TaskFormDialog';
import ConfirmDeleteDialog from './components/ConfirmDeleteDialog';
import {
  fetchTasks,
  fetchStats,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask
} from './services/taskApi';

const DEFAULT_FILTERS = {
  subject: 'All',
  priority: 'All',
  status: 'All',
  category: 'All',
  search: ''
};

export default function App() {
  const [activeSection, setActiveSection] = useState('overview'); // 'overview' | 'analytics' | 'tasks' | 'planner'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
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
      const [filteredTasksData, allTasksData, statsData] = await Promise.all([
        fetchTasks(currentFilters),
        fetchTasks(DEFAULT_FILTERS),
        fetchStats()
      ]);
      setTasks(filteredTasksData);
      setAllTasks(allTasksData);
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
    allTasks.forEach((t) => {
      if (t.subject) set.add(t.subject);
    });
    return Array.from(set).sort();
  }, [stats, allTasks]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleQuickFilterAndNavigate = (key, value) => {
    setFilters({ ...DEFAULT_FILTERS, [key]: value });
    setActiveSection('tasks');
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

  const sectionMeta = {
    overview: {
      title: 'Dashboard Overview',
      subtitle: 'Real-time academic workload summary & approaching deadline radar'
    },
    analytics: {
      title: 'Graphs & Infographics',
      subtitle: 'Visual breakdown of completion progress, 7-day deadline spikes, priorities, and courses'
    },
    tasks: {
      title: 'Academic Task Manager',
      subtitle: 'Create, filter, update, and track assignments across all subjects'
    },
    planner: {
      title: 'Study Planner & Schedule Generator',
      subtitle: 'Automated daily study session blocks tailored to your deadlines and daily capacity'
    }
  }[activeSection];

  return (
    <div className="app-shell bg-body-tertiary">
      {/* Left Side Navigation Bar */}
      <SidebarNav
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        stats={stats}
        onOpenCreateTask={handleOpenCreate}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Right Main Content Area */}
      <div className="app-main-column d-flex flex-column min-vh-100">
        {/* Top Workspace Bar */}
        <header className="bg-white border-bottom sticky-top py-3 px-4 shadow-xs">
          <div className="d-flex align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <button
                type="button"
                className="btn btn-outline-secondary d-lg-none"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open side navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                <i className="bi bi-list fs-5" aria-hidden="true"></i>
              </button>
              <div>
                <h1 className="h5 fw-bold mb-0 text-dark">{sectionMeta.title}</h1>
                <p className="text-muted small mb-0 d-none d-sm-block">{sectionMeta.subtitle}</p>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              {activeSection !== 'planner' && (
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm px-3 fw-semibold d-none d-md-inline-flex align-items-center gap-1"
                  onClick={() => setActiveSection('planner')}
                >
                  <i className="bi bi-calendar2-week" aria-hidden="true"></i>
                  Study Planner
                </button>
              )}
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

        {/* Active Module Content */}
        <main id="top" className="container-fluid p-4 flex-grow-1">
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
            <div
              className="alert alert-danger d-flex align-items-center justify-content-between"
              role="alert"
            >
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

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading academic workspace...</span>
              </div>
            </div>
          ) : (
            <>
              {/* 1. DASHBOARD OVERVIEW SECTION */}
              {activeSection === 'overview' && (
                <DashboardSummary
                  stats={stats}
                  onQuickFilterStatus={(st) => handleQuickFilterAndNavigate('status', st)}
                  onSelectTaskEdit={handleOpenEdit}
                  onNavigateSection={setActiveSection}
                />
              )}

              {/* 2. GRAPHS & INFOGRAPHICS SECTION */}
              {activeSection === 'analytics' && (
                <section aria-label="Graphs and Infographics Analytics">
                  <WorkloadCharts
                    stats={stats}
                    onQuickFilterStatus={(st) => handleQuickFilterAndNavigate('status', st)}
                    onQuickFilterPriority={(prio) => handleQuickFilterAndNavigate('priority', prio)}
                    onQuickFilterCategory={(cat) => handleQuickFilterAndNavigate('category', cat)}
                  />

                  {/* Detailed Course Effort & Completion Infographic */}
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex align-items-center justify-content-between">
                      <div>
                        <h2 className="h6 fw-bold mb-0">
                          Course-by-Course Workload & Completion Infographic
                        </h2>
                        <small className="text-muted">
                          Click any course card to view its assignments in the Task Manager
                        </small>
                      </div>
                      <i className="bi bi-bar-chart-steps text-primary fs-5" aria-hidden="true"></i>
                    </div>
                    <div className="card-body px-4 pb-4">
                      {stats?.subjectBreakdown && stats.subjectBreakdown.length > 0 ? (
                        <div className="row g-3">
                          {stats.subjectBreakdown.map((subj) => {
                            const donePct =
                              subj.total > 0 ? Math.round((subj.completed / subj.total) * 100) : 0;
                            const progPct =
                              subj.total > 0 ? Math.round((subj.inProgress / subj.total) * 100) : 0;
                            const pendPct =
                              subj.total > 0 ? Math.max(0, 100 - donePct - progPct) : 0;
                            return (
                              <div className="col-12 col-md-6" key={subj.subject}>
                                <div
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => handleQuickFilterAndNavigate('subject', subj.subject)}
                                  onKeyDown={(e) =>
                                    e.key === 'Enter' &&
                                    handleQuickFilterAndNavigate('subject', subj.subject)
                                  }
                                  className="p-3 rounded-3 bg-light border h-100 kpi-card"
                                >
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="fw-bold text-dark">{subj.subject}</span>
                                    <div className="d-flex align-items-center gap-2">
                                      <span className="badge bg-white text-secondary border">
                                        {subj.hoursRemaining}h remaining
                                      </span>
                                      <span className="small fw-bold text-success">
                                        {donePct}% Done
                                      </span>
                                    </div>
                                  </div>
                                  <div
                                    className="progress rounded-pill overflow-hidden"
                                    style={{ height: '10px' }}
                                  >
                                    <div
                                      className="progress-bar bg-success"
                                      style={{ width: `${donePct}%` }}
                                      title={`Completed: ${subj.completed}`}
                                    />
                                    <div
                                      className="progress-bar bg-info"
                                      style={{ width: `${progPct}%` }}
                                      title={`In Progress: ${subj.inProgress}`}
                                    />
                                    <div
                                      className="progress-bar bg-warning"
                                      style={{ width: `${pendPct}%` }}
                                      title={`Pending: ${subj.pending}`}
                                    />
                                  </div>
                                  <div className="d-flex justify-content-between text-muted mt-2 small">
                                    <span>
                                      {subj.completed} Completed • {subj.inProgress} In Progress •{' '}
                                      {subj.pending} Pending
                                    </span>
                                    <span className="fw-semibold">
                                      {subj.totalHours ?? subj.hoursRemaining}h total
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-muted small mb-0">No course data available yet.</p>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* 3. TASK MANAGER SECTION */}
              {activeSection === 'tasks' && (
                <section aria-label="Academic Task Manager">
                  <FilterBar
                    filters={filters}
                    subjects={availableSubjects}
                    onFilterChange={handleFilterChange}
                    onResetFilters={handleResetFilters}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    totalShowing={tasks.length}
                  />

                  <TaskTable
                    tasks={tasks}
                    viewMode={viewMode}
                    onStatusChange={handleStatusChange}
                    onEditTask={handleOpenEdit}
                    onRequestDelete={(task) => setTaskToDelete(task)}
                  />
                </section>
              )}

              {/* 4. STUDY PLANNER SECTION */}
              {activeSection === 'planner' && (
                <StudyPlanner
                  tasks={allTasks}
                  onStatusChange={handleStatusChange}
                  onEditTask={handleOpenEdit}
                  onOpenCreateTask={handleOpenCreate}
                />
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-top py-3 px-4 mt-auto">
          <div className="d-flex flex-wrap justify-content-between align-items-center small text-muted">
            <span>
              <strong>UniPulse</strong> — Centralized Academic Workload & Study Planner
            </span>
            <span>React + Bootstrap 5 • Node.js + Express REST API • MongoDB</span>
          </div>
        </footer>
      </div>

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
