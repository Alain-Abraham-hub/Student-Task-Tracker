import React, { useState } from 'react';

const CATEGORY_META = {
  Assignment: { icon: 'bi-file-earmark-text-fill', color: '#3b82f6' },
  Exam: { icon: 'bi-patch-exclamation-fill', color: '#ef4444' },
  Project: { icon: 'bi-kanban-fill', color: '#8b5cf6' },
  Lab: { icon: 'bi-cpu-fill', color: '#06b6d4' },
  Reading: { icon: 'bi-book-half', color: '#10b981' },
  Quiz: { icon: 'bi-lightning-fill', color: '#f59e0b' },
  Presentation: { icon: 'bi-easel2-fill', color: '#ec4899' },
  Other: { icon: 'bi-Bookmark-star-fill', color: '#64748b' }
};

export default function WorkloadCharts({
  stats,
  onQuickFilterStatus,
  onQuickFilterPriority,
  onQuickFilterCategory
}) {
  const [horizonMetric, setHorizonMetric] = useState('tasks'); // 'tasks' | 'hours'

  if (!stats) return null;

  const total = stats.total || 0;
  const completed = stats.completed || 0;
  const inProgress = stats.inProgress || 0;
  const pending = stats.pending || 0;

  // Percentages for multi-segment conic-gradient status donut
  const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const inProgressPct = total > 0 ? Math.round((inProgress / total) * 100) : 0;
  const pendingPct = total > 0 ? Math.max(0, 100 - completedPct - inProgressPct) : 0;

  const stop1 = completedPct;
  const stop2 = completedPct + inProgressPct;

  // Priority breakdown metrics
  const priorityCounts = stats.priorityBreakdown || { High: 0, Medium: 0, Low: 0 };
  const priorityHours = stats.priorityHoursBreakdown || { High: 0, Medium: 0, Low: 0 };
  const highPct = total > 0 ? Math.round((priorityCounts.High / total) * 100) : 0;
  const medPct = total > 0 ? Math.round((priorityCounts.Medium / total) * 100) : 0;
  const lowPct = total > 0 ? Math.max(0, 100 - highPct - medPct) : 0;

  // 7-day timeline bars (plus Overdue column if any)
  const timeline = stats.upcomingTimeline || [];
  const maxTimelineTasks = Math.max(
    1,
    stats.overdueCount || 0,
    ...timeline.map((d) => d.totalTasks || 0)
  );
  const maxTimelineHours = Math.max(
    1,
    ...timeline.map((d) => d.hours || 0)
  );

  // Category breakdown sorted by count descending
  const categoryEntries = Object.entries(stats.categoryBreakdown || {}).sort(
    (a, b) => b[1] - a[1]
  );
  const maxCategoryCount = Math.max(1, ...categoryEntries.map(([, count]) => count));

  // Study hours metrics
  const totalHours =
    stats.totalEstimatedHours ??
    Number((stats.totalEstimatedHoursRemaining || 0).toFixed(1));
  const completedHours = stats.completedHours ?? 0;
  const hoursCompletionPct =
    totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0;

  return (
    <div className="row g-4 mb-4">
      {/* 1. Task Status Donut Infographic & Study Hours Gauge */}
      <div className="col-12 col-md-6 col-xl-4">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex align-items-center justify-content-between">
            <div>
              <h3 className="h6 fw-bold mb-0">Workload Status Distribution</h3>
              <small className="text-muted">Click any segment legend to filter tasks</small>
            </div>
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
              <i className="bi bi-pie-chart-fill me-1" aria-hidden="true"></i>
              Donut
            </span>
          </div>

          <div className="card-body px-4 pb-4 d-flex flex-column justify-content-between">
            <div className="d-flex flex-wrap align-items-center justify-content-center gap-4 my-2">
              {/* Conic-gradient Status Donut */}
              <div
                className="status-donut-chart"
                aria-hidden="true"
                style={{
                  '--stop-1': `${stop1}%`,
                  '--stop-2': `${stop2}%`,
                  '--empty': total === 0 ? 1 : 0
                }}
              >
                <div className="status-donut-hole">
                  <span className="h4 fw-bold mb-0 text-dark">{total}</span>
                  <span className="text-uppercase text-muted" style={{ fontSize: '0.68rem' }}>
                    Total Tasks
                  </span>
                </div>
              </div>

              {/* Interactive Legend Buttons */}
              <div className="d-flex flex-column gap-2 flex-grow-1" style={{ minWidth: '150px' }}>
                <button
                  type="button"
                  onClick={() => onQuickFilterStatus('Completed')}
                  className="btn btn-sm btn-light border d-flex align-items-center justify-content-between px-3 py-2 text-start"
                >
                  <span className="d-flex align-items-center gap-2">
                    <span
                      className="legend-dot"
                      style={{ backgroundColor: '#10b981' }}
                      aria-hidden="true"
                    />
                    <span className="fw-semibold small">Completed</span>
                  </span>
                  <span className="badge bg-white text-dark border">
                    {completed} ({completedPct}%)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onQuickFilterStatus('In Progress')}
                  className="btn btn-sm btn-light border d-flex align-items-center justify-content-between px-3 py-2 text-start"
                >
                  <span className="d-flex align-items-center gap-2">
                    <span
                      className="legend-dot"
                      style={{ backgroundColor: '#06b6d4' }}
                      aria-hidden="true"
                    />
                    <span className="fw-semibold small">In Progress</span>
                  </span>
                  <span className="badge bg-white text-dark border">
                    {inProgress} ({inProgressPct}%)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onQuickFilterStatus('Pending')}
                  className="btn btn-sm btn-light border d-flex align-items-center justify-content-between px-3 py-2 text-start"
                >
                  <span className="d-flex align-items-center gap-2">
                    <span
                      className="legend-dot"
                      style={{ backgroundColor: '#f59e0b' }}
                      aria-hidden="true"
                    />
                    <span className="fw-semibold small">Pending</span>
                  </span>
                  <span className="badge bg-white text-dark border">
                    {pending} ({pendingPct}%)
                  </span>
                </button>
              </div>
            </div>

            {/* Mandatory accessible data table fallback for CSS gradient chart */}
            <table className="visually-hidden">
              <caption>Academic Task Status Distribution</caption>
              <thead>
                <tr>
                  <th scope="col">Status</th>
                  <th scope="col">Task Count</th>
                  <th scope="col">Percentage</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Completed</td>
                  <td>{completed}</td>
                  <td>{completedPct}%</td>
                </tr>
                <tr>
                  <td>In Progress</td>
                  <td>{inProgress}</td>
                  <td>{inProgressPct}%</td>
                </tr>
                <tr>
                  <td>Pending</td>
                  <td>{pending}</td>
                  <td>{pendingPct}%</td>
                </tr>
              </tbody>
            </table>

            {/* Study Hours Burn-down Infographic */}
            <div className="p-3 rounded-3 bg-light border mt-3">
              <div className="d-flex justify-content-between align-items-center small mb-1">
                <span className="fw-bold text-secondary">
                  <i className="bi bi-hourglass-split me-1 text-primary" aria-hidden="true"></i>
                  Study Hours Invested
                </span>
                <span className="fw-bold text-dark">
                  {completedHours}h / {totalHours}h ({hoursCompletionPct}%)
                </span>
              </div>
              <div
                className="progress"
                role="progressbar"
                aria-label="Completed study hours ratio"
                aria-valuenow={hoursCompletionPct}
                aria-valuemin="0"
                aria-valuemax="100"
                style={{ height: '8px' }}
              >
                <div
                  className="progress-bar chart-gradient-bar"
                  style={{ width: `${hoursCompletionPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 7-Day Upcoming Deadline Horizon Bar Graph */}
      <div className="col-12 col-md-6 col-xl-4">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <h3 className="h6 fw-bold mb-0">7-Day Deadline Horizon</h3>
              <small className="text-muted">Upcoming daily task & effort spikes</small>
            </div>
            <div className="btn-group btn-group-sm" role="group" aria-label="Horizon chart metric">
              <button
                type="button"
                className={`btn ${horizonMetric === 'tasks' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setHorizonMetric('tasks')}
              >
                Tasks
              </button>
              <button
                type="button"
                className={`btn ${horizonMetric === 'hours' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setHorizonMetric('hours')}
              >
                Hours
              </button>
            </div>
          </div>

          <div className="card-body px-4 pb-4 d-flex flex-column justify-content-between">
            <div className="horizon-chart-container pt-3 pb-2" aria-hidden="true">
              {/* Overdue Column */}
              <div className="horizon-bar-col">
                <span className="horizon-bar-val text-danger fw-bold">
                  {horizonMetric === 'tasks' ? stats.overdueCount || 0 : '—'}
                </span>
                <div className="horizon-bar-track">
                  <div
                    className="horizon-bar-fill bg-danger"
                    style={{
                      height:
                        horizonMetric === 'tasks' && (stats.overdueCount || 0) > 0
                          ? `${Math.max(12, Math.round(((stats.overdueCount || 0) / maxTimelineTasks) * 100))}%`
                          : '4%'
                    }}
                  />
                </div>
                <span className="horizon-bar-label text-danger fw-semibold">Late</span>
                <span className="horizon-bar-sub">Past</span>
              </div>

              {/* Next 7 Days Columns */}
              {timeline.map((day, idx) => {
                const rawVal = horizonMetric === 'tasks' ? day.totalTasks : day.hours;
                const maxVal = horizonMetric === 'tasks' ? maxTimelineTasks : maxTimelineHours;
                const heightPct =
                  rawVal > 0 ? Math.max(14, Math.round((rawVal / maxVal) * 100)) : 4;
                const barColorClass =
                  rawVal === 0
                    ? 'bg-secondary bg-opacity-25'
                    : idx === 0
                    ? 'bg-warning'
                    : idx <= 2
                    ? 'bg-info'
                    : 'bg-primary';

                return (
                  <div key={day.date} className="horizon-bar-col" title={`${day.date}: ${day.totalTasks} tasks (${day.hours}h active)`}>
                    <span className="horizon-bar-val fw-semibold text-dark">
                      {horizonMetric === 'tasks' ? day.totalTasks : `${day.hours}h`}
                    </span>
                    <div className="horizon-bar-track">
                      <div
                        className={`horizon-bar-fill ${barColorClass}`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className={`horizon-bar-label ${idx === 0 ? 'fw-bold text-primary' : ''}`}>
                      {day.dayName}
                    </span>
                    <span className="horizon-bar-sub">{day.shortDate}</span>
                  </div>
                );
              })}
            </div>

            {/* Accessible Data Table for 7-Day Horizon */}
            <table className="visually-hidden">
              <caption>7-Day Upcoming Academic Deadlines</caption>
              <thead>
                <tr>
                  <th scope="col">Day</th>
                  <th scope="col">Date</th>
                  <th scope="col">Total Tasks</th>
                  <th scope="col">Active Study Hours</th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((day) => (
                  <tr key={day.date}>
                    <td>{day.dayName}</td>
                    <td>{day.date}</td>
                    <td>{day.totalTasks}</td>
                    <td>{day.hours} hours</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="d-flex align-items-center justify-content-between small text-muted pt-2 border-top">
              <span>
                <span className="badge bg-danger me-1">&nbsp;</span> Overdue
                <span className="badge bg-warning ms-2 me-1">&nbsp;</span> Today
                <span className="badge bg-info ms-2 me-1">&nbsp;</span> Next 48h
              </span>
              <span className="fw-semibold text-dark">
                {stats.highPriorityPending || 0} High-Priority Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Priority & Category Infographics */}
      <div className="col-12 col-xl-4">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex align-items-center justify-content-between">
            <div>
              <h3 className="h6 fw-bold mb-0">Priority & Category Mix</h3>
              <small className="text-muted">Urgency tiers & assignment types</small>
            </div>
            <i className="bi bi-sliders2-vertical text-primary fs-5" aria-hidden="true"></i>
          </div>

          <div className="card-body px-4 pb-4 d-flex flex-column justify-content-between gap-3">
            {/* Stacked Priority Distribution Bar */}
            <div>
              <div className="d-flex justify-content-between small fw-semibold mb-1">
                <span>Priority Spectrum</span>
                <span className="text-muted">{total} total</span>
              </div>
              <div className="progress rounded-pill overflow-hidden" style={{ height: '12px' }}>
                <div
                  className="progress-bar bg-danger"
                  role="progressbar"
                  style={{ width: `${highPct}%` }}
                  aria-label={`High priority ${highPct}%`}
                  title={`High Priority: ${priorityCounts.High} tasks (${highPct}%)`}
                />
                <div
                  className="progress-bar bg-warning"
                  role="progressbar"
                  style={{ width: `${medPct}%` }}
                  aria-label={`Medium priority ${medPct}%`}
                  title={`Medium Priority: ${priorityCounts.Medium} tasks (${medPct}%)`}
                />
                <div
                  className="progress-bar bg-secondary"
                  role="progressbar"
                  style={{ width: `${lowPct}%` }}
                  aria-label={`Low priority ${lowPct}%`}
                  title={`Low Priority: ${priorityCounts.Low} tasks (${lowPct}%)`}
                />
              </div>

              <div className="row g-2 mt-2">
                {(['High', 'Medium', 'Low']).map((prio) => {
                  const badgeStyle =
                    prio === 'High'
                      ? 'border-danger-subtle bg-danger-subtle text-danger-emphasis'
                      : prio === 'Medium'
                      ? 'border-warning-subtle bg-warning-subtle text-warning-emphasis'
                      : 'border-secondary-subtle bg-light text-secondary';
                  return (
                    <div className="col-4" key={prio}>
                      <button
                        type="button"
                        onClick={() => onQuickFilterPriority && onQuickFilterPriority(prio)}
                        className={`btn btn-sm w-100 border rounded-3 p-2 text-center ${badgeStyle}`}
                      >
                        <div className="fw-bold">{priorityCounts[prio] || 0}</div>
                        <div style={{ fontSize: '0.72rem' }}>{prio}</div>
                        <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                          {priorityHours[prio] || 0}h left
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Horizontal Bars */}
            <div className="border-top pt-3">
              <div className="small fw-semibold mb-2">Tasks by Academic Category</div>
              {categoryEntries.length === 0 ? (
                <p className="small text-muted mb-0">No categories recorded yet.</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {categoryEntries.slice(0, 4).map(([cat, count]) => {
                    const meta = CATEGORY_META[cat] || CATEGORY_META.Other;
                    const widthPct = Math.round((count / maxCategoryCount) * 100);
                    const sharePct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div
                        key={cat}
                        role="button"
                        tabIndex={0}
                        onClick={() => onQuickFilterCategory && onQuickFilterCategory(cat)}
                        onKeyDown={(e) =>
                          e.key === 'Enter' && onQuickFilterCategory && onQuickFilterCategory(cat)
                        }
                        className="category-bar-item p-1 rounded-2"
                      >
                        <div className="d-flex justify-content-between align-items-center small mb-1">
                          <span className="fw-semibold text-dark d-flex align-items-center gap-2">
                            <i
                              className={`bi ${meta.icon}`}
                              style={{ color: meta.color }}
                              aria-hidden="true"
                            ></i>
                            {cat}
                          </span>
                          <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                            <strong className="text-dark">{count}</strong> ({sharePct}%)
                          </span>
                        </div>
                        <div className="progress" style={{ height: '6px' }}>
                          <div
                            className="progress-bar"
                            style={{
                              width: `${widthPct}%`,
                              backgroundColor: meta.color
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

