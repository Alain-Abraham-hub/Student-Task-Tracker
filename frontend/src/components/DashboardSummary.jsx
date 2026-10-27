import React from 'react';
import { formatCalendarDeadline, getDeadlineUrgency } from '../utils/dateUtils';

export default function DashboardSummary({ stats, onQuickFilterStatus, onSelectTaskEdit }) {
  if (!stats) return null;

  const urgentItems = [...(stats.overdueTasks || []), ...(stats.approachingTasks || [])];

  return (
    <section aria-label="Academic Workload Overview" className="mb-4">
      {/* Top KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card h-100 border-0 shadow-sm kpi-card"
            role="button"
            tabIndex={0}
            onClick={() => onQuickFilterStatus('All')}
            onKeyDown={(e) => e.key === 'Enter' && onQuickFilterStatus('All')}
          >
            <div className="card-body d-flex align-items-center justify-content-between p-4">
              <div>
                <p className="text-uppercase text-muted small fw-bold mb-1">Total Academic Tasks</p>
                <h2 className="display-6 fw-bold mb-1 text-dark">{stats.total}</h2>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                  <i className="bi bi-clock-history me-1" aria-hidden="true"></i>
                  {stats.totalEstimatedHoursRemaining}h active workload
                </span>
              </div>
              <div className="kpi-icon bg-primary bg-opacity-10 text-primary rounded-4 p-3">
                <i className="bi bi-journal-bookmark-fill fs-2" aria-hidden="true"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card h-100 border-0 shadow-sm kpi-card"
            role="button"
            tabIndex={0}
            onClick={() => onQuickFilterStatus('In Progress')}
            onKeyDown={(e) => e.key === 'Enter' && onQuickFilterStatus('In Progress')}
          >
            <div className="card-body d-flex align-items-center justify-content-between p-4">
              <div>
                <p className="text-uppercase text-muted small fw-bold mb-1">Active & Pending</p>
                <h2 className="display-6 fw-bold mb-1 text-dark">
                  {stats.pending + stats.inProgress}
                </h2>
                <div className="d-flex gap-2 flex-wrap">
                  <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle">
                    {stats.inProgress} In Progress
                  </span>
                  <span className="badge bg-secondary-subtle text-secondary-emphasis border">
                    {stats.pending} Pending
                  </span>
                </div>
              </div>
              <div className="kpi-icon bg-info bg-opacity-10 text-info rounded-4 p-3">
                <i className="bi bi-lightning-charge-fill fs-2" aria-hidden="true"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100 border-0 shadow-sm kpi-card border-start border-4 border-danger">
            <div className="card-body d-flex align-items-center justify-content-between p-4">
              <div>
                <p className="text-uppercase text-muted small fw-bold mb-1">Urgent Radar (≤ 3d)</p>
                <h2 className="display-6 fw-bold mb-1 text-danger">
                  {stats.overdueCount + stats.approachingCount}
                </h2>
                <div className="d-flex gap-2 flex-wrap">
                  <span className="badge bg-danger text-white">
                    {stats.overdueCount} Overdue
                  </span>
                  <span className="badge bg-warning text-dark">
                    {stats.approachingCount} Due Soon
                  </span>
                </div>
              </div>
              <div className="kpi-icon bg-danger bg-opacity-10 text-danger rounded-4 p-3">
                <i className="bi bi-alarm-fill fs-2" aria-hidden="true"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card h-100 border-0 shadow-sm kpi-card"
            role="button"
            tabIndex={0}
            onClick={() => onQuickFilterStatus('Completed')}
            onKeyDown={(e) => e.key === 'Enter' && onQuickFilterStatus('Completed')}
          >
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div>
                  <p className="text-uppercase text-muted small fw-bold mb-1">Completion Rate</p>
                  <h2 className="display-6 fw-bold mb-0 text-success">{stats.completionRate}%</h2>
                </div>
                <div className="kpi-icon bg-success bg-opacity-10 text-success rounded-4 p-3">
                  <i className="bi bi-trophy-fill fs-2" aria-hidden="true"></i>
                </div>
              </div>
              <div
                className="progress"
                role="progressbar"
                aria-label="Academic task completion percentage"
                aria-valuenow={stats.completionRate}
                aria-valuemin="0"
                aria-valuemax="100"
                style={{ height: '8px' }}
              >
                <div
                  className="progress-bar bg-success"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
              <small className="text-muted mt-2 d-block">
                {stats.completed} of {stats.total} tasks completed
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Approaching Deadlines Alert Panel & Subject Workload Distribution */}
      <div className="row g-4">
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <span className="badge rounded-pill bg-danger p-2">
                  <i className="bi bi-bell-fill" aria-hidden="true"></i>
                </span>
                <div>
                  <h3 className="h6 fw-bold mb-0">Approaching & Overdue Deadlines</h3>
                  <small className="text-muted">
                    Prioritized alerts for assignments due within 72 hours or past due
                  </small>
                </div>
              </div>
              <span className="badge bg-light text-dark border">
                {urgentItems.length} {urgentItems.length === 1 ? 'Alert' : 'Alerts'}
              </span>
            </div>
            <div className="card-body px-4 pb-4">
              {urgentItems.length === 0 ? (
                <div className="text-center py-4 bg-light rounded-3">
                  <i className="bi bi-check-circle-fill text-success fs-2 d-block mb-2" aria-hidden="true"></i>
                  <p className="fw-semibold mb-1">All caught up on immediate deadlines!</p>
                  <small className="text-muted">No pending tasks are overdue or due within the next 3 days.</small>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {urgentItems.slice(0, 5).map((task) => {
                    const urgency = getDeadlineUrgency(task.deadline, task.status);
                    return (
                      <div
                        key={task._id}
                        className="list-group-item px-3 py-3 rounded-3 mb-2 border d-flex flex-wrap align-items-center justify-content-between gap-2 urgent-item-row"
                      >
                        <div className="d-flex align-items-start gap-3">
                          <span
                            className={`badge rounded-pill mt-1 ${
                              task.priority === 'High'
                                ? 'bg-danger'
                                : task.priority === 'Medium'
                                ? 'bg-warning text-dark'
                                : 'bg-secondary'
                            }`}
                          >
                            {task.priority}
                          </span>
                          <div>
                            <div className="fw-semibold text-dark">{task.title}</div>
                            <div className="small text-muted d-flex flex-wrap align-items-center gap-2 mt-1">
                              <span>
                                <i className="bi bi-book me-1" aria-hidden="true"></i>
                                {task.subject}
                              </span>
                              <span>•</span>
                              <span>{task.category}</span>
                              <span>•</span>
                              <span>
                                <i className="bi bi-calendar3 me-1" aria-hidden="true"></i>
                                {formatCalendarDeadline(task.deadline)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-2 ms-auto">
                          <span className={`badge ${urgency.badgeClass}`}>
                            <i className={`bi ${urgency.icon} me-1`} aria-hidden="true"></i>
                            {urgency.badgeText}
                          </span>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => onSelectTaskEdit(task)}
                            aria-label={`Inspect or edit ${task.title}`}
                          >
                            <i className="bi bi-pencil-square" aria-hidden="true"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex align-items-center justify-content-between">
              <div>
                <h3 className="h6 fw-bold mb-0">Subject Workload Breakdown</h3>
                <small className="text-muted">Progress and remaining hours per course</small>
              </div>
              <i className="bi bi-bar-chart-steps text-primary fs-5" aria-hidden="true"></i>
            </div>
            <div className="card-body px-4 pb-4">
              {stats.subjectBreakdown && stats.subjectBreakdown.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {stats.subjectBreakdown.map((subj) => {
                    const pct = subj.total > 0 ? Math.round((subj.completed / subj.total) * 100) : 0;
                    return (
                      <div key={subj.subject} className="p-2 rounded-3 bg-light border">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-semibold small text-dark">{subj.subject}</span>
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-white text-secondary border">
                              {subj.hoursRemaining}h left
                            </span>
                            <span className="small fw-bold text-primary">
                              {subj.completed}/{subj.total} done
                            </span>
                          </div>
                        </div>
                        <div
                          className="progress"
                          role="progressbar"
                          aria-label={`${subj.subject} completion`}
                          aria-valuenow={pct}
                          aria-valuemin="0"
                          aria-valuemax="100"
                          style={{ height: '6px' }}
                        >
                          <div
                            className="progress-bar bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted small mb-0">No subjects recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

