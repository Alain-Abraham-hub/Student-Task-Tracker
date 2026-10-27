import React from 'react';
import { formatCalendarDeadline, getDeadlineUrgency } from '../utils/dateUtils';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed'];

export default function TaskTable({
  tasks,
  viewMode,
  onStatusChange,
  onEditTask,
  onRequestDelete
}) {
  if (tasks.length === 0) {
    return (
      <div className="card border-0 shadow-sm text-center py-5 px-3">
        <div className="py-3">
          <i className="bi bi-clipboard2-check text-muted display-4 d-block mb-3" aria-hidden="true"></i>
          <h3 className="h5 fw-bold">No matching academic tasks found</h3>
          <p className="text-muted mb-0">
            Try adjusting your subject, priority, or status filters, or add a new assignment above.
          </p>
        </div>
      </div>
    );
  }

  if (viewMode === 'board') {
    return (
      <div className="row g-4">
        {STATUS_OPTIONS.map((columnStatus) => {
          const columnTasks = tasks.filter((t) => t.status === columnStatus);
          const headerBadge =
            columnStatus === 'Completed'
              ? 'bg-success'
              : columnStatus === 'In Progress'
              ? 'bg-info text-dark'
              : 'bg-secondary';

          return (
            <div key={columnStatus} className="col-12 col-lg-4">
              <div className="card border-0 shadow-sm h-100 bg-light">
                <div className="card-header bg-white border-0 py-3 px-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <span className={`badge rounded-pill ${headerBadge}`}>{columnTasks.length}</span>
                    <h3 className="h6 fw-bold mb-0">{columnStatus}</h3>
                  </div>
                </div>
                <div className="card-body p-3 d-flex flex-column gap-3">
                  {columnTasks.length === 0 ? (
                    <div className="text-center text-muted small py-4 border rounded-3 bg-white">
                      No tasks in {columnStatus}
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const urgency = getDeadlineUrgency(task.deadline, task.status);
                      return (
                        <div key={task._id} className="card border-0 shadow-sm">
                          <div className="card-body p-3">
                            <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                              <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                                {task.subject}
                              </span>
                              <span
                                className={`badge ${
                                  task.priority === 'High'
                                    ? 'bg-danger'
                                    : task.priority === 'Medium'
                                    ? 'bg-warning text-dark'
                                    : 'bg-secondary'
                                }`}
                              >
                                {task.priority}
                              </span>
                            </div>

                            <h4
                              className={`h6 fw-bold mb-1 ${
                                task.status === 'Completed' ? 'text-decoration-line-through text-muted' : ''
                              }`}
                            >
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="small text-muted mb-2">{task.description}</p>
                            )}

                            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 pt-2 border-top">
                              <span className={`badge ${urgency.badgeClass}`}>
                                <i className={`bi ${urgency.icon} me-1`} aria-hidden="true"></i>
                                {urgency.badgeText}
                              </span>
                              <span className="small text-muted">
                                <i className="bi bi-calendar3 me-1" aria-hidden="true"></i>
                                {formatCalendarDeadline(task.deadline)}
                              </span>
                            </div>

                            <div className="d-flex align-items-center justify-content-between gap-2 mt-3">
                              <select
                                aria-label={`Change status for ${task.title}`}
                                className="form-select form-select-sm w-auto"
                                value={task.status}
                                onChange={(e) => onStatusChange(task._id, e.target.value)}
                              >
                                {STATUS_OPTIONS.map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>

                              <div className="btn-group btn-group-sm">
                                <button
                                  type="button"
                                  className="btn btn-outline-primary"
                                  onClick={() => onEditTask(task)}
                                  aria-label={`Edit ${task.title}`}
                                >
                                  <i className="bi bi-pencil" aria-hidden="true"></i>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger"
                                  onClick={() => onRequestDelete(task)}
                                  aria-label={`Delete ${task.title}`}
                                >
                                  <i className="bi bi-trash" aria-hidden="true"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm">
      <div
        tabIndex={0}
        role="region"
        aria-labelledby="academic-tasks-table-caption"
        className="table-wrapper"
      >
        <table className="table table-hover align-middle mb-0 task-responsive-table">
          <caption id="academic-tasks-table-caption" className="visually-hidden">
            Academic assignments, deadlines, priorities, and completion statuses
          </caption>
          <thead className="table-light">
            <tr>
              <th scope="col">Task & Description</th>
              <th scope="col">Subject & Category</th>
              <th scope="col">Deadline & Urgency</th>
              <th scope="col">Priority</th>
              <th scope="col">Status</th>
              <th scope="col" className="text-end">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const urgency = getDeadlineUrgency(task.deadline, task.status);
              return (
                <tr key={task._id} className={task.status === 'Completed' ? 'table-light' : ''}>
                  <th scope="row" className="fw-semibold">
                    <div className="d-flex align-items-start gap-2">
                      <div>
                        <div
                          className={`fw-bold ${
                            task.status === 'Completed'
                              ? 'text-decoration-line-through text-muted'
                              : 'text-dark'
                          }`}
                        >
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="small text-muted fw-normal mt-1 task-desc-cell">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                  <td>
                    <div className="d-flex flex-wrap align-items-center gap-1">
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                        {task.subject}
                      </span>
                      <span className="badge bg-light text-secondary border">{task.category}</span>
                      <span className="small text-muted ms-1">({task.estimatedHours || 2}h)</span>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex flex-column align-items-start gap-1">
                      <span className="small fw-semibold text-dark">
                        <i className="bi bi-calendar3 me-1 text-muted" aria-hidden="true"></i>
                        {formatCalendarDeadline(task.deadline)}
                      </span>
                      <span className={`badge ${urgency.badgeClass}`}>
                        <i className={`bi ${urgency.icon} me-1`} aria-hidden="true"></i>
                        {urgency.badgeText}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge rounded-pill ${
                        task.priority === 'High'
                          ? 'bg-danger'
                          : task.priority === 'Medium'
                          ? 'bg-warning text-dark'
                          : 'bg-secondary'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td>
                    <select
                      aria-label={`Status for ${task.title}`}
                      className={`form-select form-select-sm status-select ${
                        task.status === 'Completed'
                          ? 'border-success text-success fw-semibold'
                          : task.status === 'In Progress'
                          ? 'border-info text-info-emphasis fw-semibold'
                          : ''
                      }`}
                      value={task.status}
                      onChange={(e) => onStatusChange(task._id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm" role="group" aria-label={`Actions for ${task.title}`}>
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => onEditTask(task)}
                        title="Edit task"
                      >
                        <i className="bi bi-pencil-square me-1" aria-hidden="true"></i>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={() => onRequestDelete(task)}
                        title="Delete task"
                      >
                        <i className="bi bi-trash" aria-hidden="true"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

