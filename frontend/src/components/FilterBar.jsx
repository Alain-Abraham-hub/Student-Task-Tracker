import React from 'react';

const CATEGORIES = ['All', 'Assignment', 'Exam', 'Project', 'Lab', 'Reading', 'Quiz', 'Presentation', 'Other'];
const PRIORITIES = ['All', 'High', 'Medium', 'Low'];
const STATUSES = ['All', 'Pending', 'In Progress', 'Completed'];

export default function FilterBar({
  filters,
  subjects,
  onFilterChange,
  onResetFilters,
  viewMode,
  onViewModeChange,
  totalShowing
}) {
  const hasActiveFilters =
    filters.subject !== 'All' ||
    filters.priority !== 'All' ||
    filters.status !== 'All' ||
    filters.category !== 'All' ||
    filters.search.trim() !== '';

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body p-3 p-md-4">
        <form
          role="search"
          aria-label="Filter academic tasks"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="row g-3 align-items-end">
            {/* Search Input */}
            <div className="col-12 col-md-4 col-lg-3">
              <label htmlFor="filter-search" className="form-label small fw-bold text-secondary mb-1">
                Search Tasks
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <i className="bi bi-search" aria-hidden="true"></i>
                </span>
                <input
                  id="filter-search"
                  name="search"
                  type="search"
                  className="form-control"
                  placeholder="Title, subject, or notes..."
                  value={filters.search}
                  onChange={(e) => onFilterChange('search', e.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>
            </div>

            {/* Subject Filter */}
            <div className="col-6 col-md-4 col-lg-2">
              <label htmlFor="filter-subject" className="form-label small fw-bold text-secondary mb-1">
                Subject / Course
              </label>
              <select
                id="filter-subject"
                name="subject"
                className="form-select"
                value={filters.subject}
                onChange={(e) => onFilterChange('subject', e.target.value)}
              >
                <option value="All">All Subjects</option>
                {subjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="col-6 col-md-4 col-lg-2">
              <label htmlFor="filter-category" className="form-label small fw-bold text-secondary mb-1">
                Category
              </label>
              <select
                id="filter-category"
                name="category"
                className="form-select"
                value={filters.category}
                onChange={(e) => onFilterChange('category', e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'All' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div className="col-6 col-md-4 col-lg-2">
              <label htmlFor="filter-priority" className="form-label small fw-bold text-secondary mb-1">
                Priority
              </label>
              <select
                id="filter-priority"
                name="priority"
                className="form-select"
                value={filters.priority}
                onChange={(e) => onFilterChange('priority', e.target.value)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p === 'All' ? 'All Priorities' : `${p} Priority`}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="col-6 col-md-4 col-lg-3">
              <label htmlFor="filter-status" className="form-label small fw-bold text-secondary mb-1">
                Task Status
              </label>
              <div className="d-flex gap-2">
                <select
                  id="filter-status"
                  name="status"
                  className="form-select"
                  value={filters.status}
                  onChange={(e) => onFilterChange('status', e.target.value)}
                >
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st === 'All' ? 'All Statuses' : st}
                    </option>
                  ))}
                </select>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary text-nowrap"
                    onClick={onResetFilters}
                    title="Clear all active filters"
                  >
                    <i className="bi bi-x-lg me-1" aria-hidden="true"></i>
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Bottom Filter Summary & View Switcher */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 pt-3 border-top">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="small text-muted">
              Showing <strong className="text-dark">{totalShowing}</strong> academic{' '}
              {totalShowing === 1 ? 'task' : 'tasks'}
            </span>
            { STATUSES.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => onFilterChange('status', st)}
                className={`btn btn-sm rounded-pill px-3 ${
                  filters.status === st ? 'btn-primary' : 'btn-light border text-secondary'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="btn-group btn-group-sm" role="group" aria-label="Task layout view mode">
            <button
              type="button"
              className={`btn ${viewMode === 'table' ? 'btn-dark' : 'btn-outline-dark'}`}
              onClick={() => onViewModeChange('table')}
            >
              <i className="bi bi-table me-1" aria-hidden="true"></i>
              Table View
            </button>
            <button
              type="button"
              className={`btn ${viewMode === 'board' ? 'btn-dark' : 'btn-outline-dark'}`}
              onClick={() => onViewModeChange('board')}
            >
              <i className="bi bi-kanban me-1" aria-hidden="true"></i>
              Status Board
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

