import React, { useEffect, useRef } from 'react';
import { formatCalendarDeadline, getDeadlineUrgency } from '../utils/dateUtils';

export default function DashboardSummary({
  stats,
  onQuickFilterStatus,
  onSelectTaskEdit,
  onNavigateSection
}) {
  const progressRef = useRef(null);

  // Sync value attribute to --value CSS custom property when CSS attr(value type(<number>)) is unsupported
  useEffect(() => {
    const progressEl = progressRef.current;
    if (!progressEl) return;

    const syncValue = () => {
      progressEl.style.setProperty('--value', progressEl.getAttribute('value') || '0');
    };
    syncValue();

    if (typeof CSS !== 'undefined' && !CSS.supports('width: attr(value type(<number>))')) {
      const observer = new MutationObserver(syncValue);
      observer.observe(progressEl, {
        attributes: true,
        attributeFilter: ['value']
      });
      return () => observer.disconnect();
    }
  }, [stats?.completionRate]);

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

        {/* Completion Rate Card with Semantic <progress class="progress-ring"> */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card h-100 border-0 shadow-sm kpi-card"
            role="button"
            tabIndex={0}
            onClick={() => onQuickFilterStatus('Completed')}
            onKeyDown={(e) => e.key === 'Enter' && onQuickFilterStatus('Completed')}
          >
            <div className="card-body d-flex align-items-center justify-content-between p-4">
              <div>
                <p className="text-uppercase text-muted small fw-bold mb-1">Completion Rate</p>
                <h2 className="display-6 fw-bold mb-1 text-success">{stats.completionRate}%</h2>
                <small className="text-muted d-block">
                  {stats.completed} of {stats.total} tasks done
                </small>
              </div>
              <div className="progress-ring-wrapper">
                <progress
                  ref={progressRef}
                  value={stats.completionRate}
                  max="100"
                  aria-label="Academic task completion percentage"
                  className="progress-ring"
                  style={{ '--value': stats.completionRate }}
                />
                <div className="progress-ring-content fw-bold small text-dark">
                  {stats.completionRate}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts Banner */}
      {onNavigateSection && (
        <div className="card border-0 shadow-sm mb-4 bg-primary bg-opacity-10 border-start border-4 border-primary">
          <div className="card-body p-3 px-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <i className="bi bi-stars text-primary fs-3" aria-hidden="true"></i>
              <div>
                <div className="fw-bold text-dark">Need a structured study timetable for your upcoming deadlines?</div>
                <small className="text-muted">
                  Use the Smart Study Planner to break your {stats.totalEstimatedHoursRemaining}h of active coursework into daily focus sessions.
                </small>
              </div>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm px-3 fw-semibold"
                onClick={() => onNavigateSection('analytics')}
              >
                <i className="bi bi-bar-chart-line me-1" aria-hidden="true"></i>
                View Graphs & Infographics
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm px-3 fw-semibold"
                onClick={() => onNavigateSection('planner')}
              >
                <i className="bi bi-calendar2-week me-1" aria-hidden="true"></i>
                Generate Study Schedule
              </button>
            </div>
          </div>
        </div>
      )}

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
                  {urgentItems.slice(0, 6).map((task) => {
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
                <h3 className="h6 fw-bold mb-0">Course Workload & Multi-Stage Progress</h3>
                <small className="text-muted">Completed, in-progress, and remaining effort per subject</small>
              </div>
              <i className="bi bi-bar-chart-steps text-primary fs-5" aria-hidden="true"></i>
            </div>
            <div className="card-body px-4 pb-4">
              {stats.subjectBreakdown && stats.subjectBreakdown.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {stats.subjectBreakdown.map((subj) => {
                    const donePct = subj.total > 0 ? Math.round((subj.completed / subj.total) * 100) : 0;
                    const progPct = subj.total > 0 ? Math.round((subj.inProgress / subj.total) * 100) : 0;
                    const pendPct = subj.total > 0 ? Math.max(0, 100 - donePct - progPct) : 0;
                    return (
                      <div key={subj.subject} className="p-3 rounded-3 bg-light border">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-bold small text-dark">{subj.subject}</span>
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-white text-secondary border">
                              {subj.hoursRemaining}h left
                            </span>
                            <span className="small fw-bold text-success">
                              {donePct}% ({subj.completed}/{subj.total})
                            </span>
                          </div>
                        </div>
                        <div
                          className="progress rounded-pill overflow-hidden"
                          style={{ height: '8px' }}
                        >
                          <div
                            className="progress-bar bg-success"
                            role="progressbar"
                            style={{ width: `${donePct}%` }}
                            aria-label={`${subj.subject} completed ${donePct}%`}
                            title={`Completed: ${subj.completed}`}
                          />
                          <div
                            className="progress-bar bg-info"
                            role="progressbar"
                            style={{ width: `${progPct}%` }}
                            aria-label={`${subj.subject} in progress ${progPct}%`}
                            title={`In Progress: ${subj.inProgress}`}
                          />
                          <div
                            className="progress-bar bg-warning"
                            role="progressbar"
                            style={{ width: `${pendPct}%` }}
                            aria-label={`${subj.subject} pending ${pendPct}%`}
                            title={`Pending: ${subj.pending}`}
                          />
                        </div>
                        <div className="d-flex justify-content-between text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                          <span>{subj.completed} Done • {subj.inProgress} Active • {subj.pending} Pending</span>
                          <span>Total Effort: {subj.totalHours ?? subj.hoursRemaining}h</span>
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
