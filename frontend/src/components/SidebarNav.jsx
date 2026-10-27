import React from 'react';

const NAV_ITEMS = [
  {
    id: 'overview',
    label: 'Dashboard Overview',
    subtitle: 'KPIs & Urgent Alerts',
    icon: 'bi-grid-1x2-fill'
  },
  {
    id: 'analytics',
    label: 'Graphs & Infographics',
    subtitle: 'Visual Workload Analytics',
    icon: 'bi-bar-chart-line-fill'
  },
  {
    id: 'tasks',
    label: 'Task Manager',
    subtitle: 'CRUD Table & Status Board',
    icon: 'bi-list-check'
  },
  {
    id: 'planner',
    label: 'Study Planner',
    subtitle: 'Generate Study Schedule',
    icon: 'bi-calendar2-week-fill'
  }
];

export default function SidebarNav({
  activeSection,
  onSelectSection,
  stats,
  onOpenCreateTask,
  mobileOpen,
  onCloseMobile
}) {
  const activeCount = (stats?.pending || 0) + (stats?.inProgress || 0);
  const urgentCount = (stats?.overdueCount || 0) + (stats?.approachingCount || 0);
  const remainingHours = stats?.totalEstimatedHoursRemaining || 0;

  const getBadgeForSection = (id) => {
    if (id === 'overview' && urgentCount > 0) {
      return (
        <span className="badge rounded-pill bg-danger text-white" title="Urgent or overdue tasks">
          {urgentCount}
        </span>
      );
    }
    if (id === 'tasks') {
      return (
        <span className="badge rounded-pill bg-secondary bg-opacity-25 text-light">
          {activeCount}
        </span>
      );
    }
    if (id === 'planner' && remainingHours > 0) {
      return (
        <span className="badge rounded-pill bg-info bg-opacity-25 text-info border border-info border-opacity-25">
          {remainingHours}h
        </span>
      );
    }
    return null;
  };

  const handleNavClick = (id) => {
    onSelectSection(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop d-lg-none"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`app-sidebar bg-dark text-white d-flex flex-column justify-content-between ${
          mobileOpen ? 'sidebar-open' : ''
        }`}
        aria-label="Primary Functional Navigation"
      >
        <div>
          {/* Brand Header */}
          <div className="p-4 border-bottom border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <span className="bg-primary text-white rounded-3 p-2 d-inline-flex align-items-center justify-content-center shadow-sm">
                <i className="bi bi-mortarboard-fill fs-4" aria-hidden="true"></i>
              </span>
              <div>
                <div className="fw-bold fs-5 lh-1">UniPulse</div>
                <small className="text-white-50" style={{ fontSize: '0.75rem' }}>
                  Academic Workspace
                </small>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-outline-light d-lg-none"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
            >
              <i className="bi bi-x-lg" aria-hidden="true"></i>
            </button>
          </div>

          {/* Primary Action Button */}
          <div className="p-3">
            <button
              type="button"
              className="btn btn-primary w-100 py-2 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
              onClick={() => {
                onOpenCreateTask();
                if (onCloseMobile) onCloseMobile();
              }}
            >
              <i className="bi bi-plus-circle-fill" aria-hidden="true"></i>
              New Academic Task
            </button>
          </div>

          {/* Navigation Menu Links */}
          <nav className="px-3 py-2" aria-label="Workspace Sections">
            <div className="text-uppercase text-white-50 fw-bold px-2 mb-2" style={{ fontSize: '0.7rem', letterSpacing: '0.06em' }}>
              Workspace Modules
            </div>
            <ul className="nav nav-pills flex-column gap-2">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <li className="nav-item" key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`nav-link w-100 text-start d-flex align-items-center justify-content-between px-3 py-2 rounded-3 sidebar-nav-btn ${
                        isActive ? 'active bg-primary text-white shadow-sm' : 'text-light'
                      }`}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <i className={`bi ${item.icon} fs-5`} aria-hidden="true"></i>
                        <div>
                          <div className="fw-semibold small lh-sm">{item.label}</div>
                          <div
                            className={isActive ? 'text-white-50' : 'text-secondary'}
                            style={{ fontSize: '0.7rem' }}
                          >
                            {item.subtitle}
                          </div>
                        </div>
                      </div>
                      {getBadgeForSection(item.id)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Bottom Workload Snapshot Footer inside Sidebar */}
        <div className="p-3 m-3 rounded-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-25">
          <div className="d-flex justify-content-between align-items-center small mb-1">
            <span className="text-white-50">Overall Progress</span>
            <span className="fw-bold text-success">{stats?.completionRate || 0}%</span>
          </div>
          <div className="progress bg-dark" style={{ height: '6px' }}>
            <div
              className="progress-bar bg-success"
              style={{ width: `${stats?.completionRate || 0}%` }}
            />
          </div>
          <div className="d-flex justify-content-between text-white-50 mt-2" style={{ fontSize: '0.72rem' }}>
            <span>{stats?.completed || 0} Done</span>
            <span>{remainingHours}h Remaining</span>
          </div>
        </div>
      </aside>
    </>
  );
}

