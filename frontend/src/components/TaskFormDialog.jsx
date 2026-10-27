import React, { useEffect, useRef, useState } from 'react';
import { getTodayISO } from '../utils/dateUtils';

const CATEGORIES = ['Assignment', 'Exam', 'Project', 'Lab', 'Reading', 'Quiz', 'Presentation', 'Other'];
const PRIORITIES = ['High', 'Medium', 'Low'];
const STATUSES = ['Pending', 'In Progress', 'Completed'];

const INITIAL_FORM = {
  title: '',
  subject: '',
  category: 'Assignment',
  priority: 'Medium',
  status: 'Pending',
  deadline: '',
  estimatedHours: 2,
  description: ''
};

export default function TaskFormDialog({
  isOpen,
  editingTask,
  existingSubjects,
  onClose,
  onSave,
  isSubmitting
}) {
  const dialogRef = useRef(null);
  const formRef = useRef(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState('');

  // Open or close native <dialog> via showModal() / close()
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (editingTask) {
        setFormData({
          title: editingTask.title || '',
          subject: editingTask.subject || '',
          category: editingTask.category || 'Assignment',
          priority: editingTask.priority || 'Medium',
          status: editingTask.status || 'Pending',
          deadline: editingTask.deadline || getTodayISO(),
          estimatedHours: editingTask.estimatedHours ?? 2,
          description: editingTask.description || ''
        });
      } else {
        setFormData({
          ...INITIAL_FORM,
          deadline: getTodayISO()
        });
      }
      setFormError('');
      // Clear any previous aria-invalid attributes
      if (formRef.current) {
        formRef.current.querySelectorAll('[aria-invalid]').forEach((el) => {
          el.removeAttribute('aria-invalid');
        });
      }
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen, editingTask]);

  // Handle native dialog close event and light-dismiss fallback where closedBy is missing
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = '';
      onClose();
    };

    dialog.addEventListener('close', handleClose);

    let cleanupFallback = null;
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const outside = (e) => {
        const r = dialog.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      let pressedOutside = false;
      const onPointerDown = (e) => {
        pressedOutside = outside(e);
      };
      const onPointerUp = (e) => {
        if (pressedOutside && outside(e)) dialog.close();
      };
      dialog.addEventListener('pointerdown', onPointerDown);
      dialog.addEventListener('pointerup', onPointerUp);
      cleanupFallback = () => {
        dialog.removeEventListener('pointerdown', onPointerDown);
        dialog.removeEventListener('pointerup', onPointerUp);
      };
    }

    return () => {
      dialog.removeEventListener('close', handleClose);
      if (cleanupFallback) cleanupFallback();
    };
  }, [onClose]);

  const syncAriaInvalid = (input) => {
    if (!input || typeof input.checkValidity !== 'function') return;
    if (!input.checkValidity()) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
  };

  const handleFieldBlur = (e) => {
    if (e.target.matches('input[required], select[required], textarea[required]')) {
      syncAriaInvalid(e.target);
    }
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (e.target.hasAttribute('aria-invalid') && e.target.checkValidity()) {
      e.target.removeAttribute('aria-invalid');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const form = formRef.current;
    if (form) {
      const requiredInputs = form.querySelectorAll('input[required], select[required]');
      requiredInputs.forEach(syncAriaInvalid);
      if (!form.checkValidity()) {
        const firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }
    }

    try {
      await onSave({
        ...formData,
        estimatedHours: Number(formData.estimatedHours) || 2
      });
    } catch (err) {
      setFormError(err.message || 'Could not save academic task.');
    }
  };

  return (
    <dialog
      ref={dialogRef}
      id="task-form-dialog"
      closedby="any"
      aria-labelledby="task-dialog-title"
      className="custom-modal-dialog border-0 rounded-4 shadow-lg p-0"
    >
      <div className="modal-content border-0">
        <div className="modal-header bg-primary text-white px-4 py-3 border-0 rounded-top-4 d-flex justify-content-between align-items-center">
          <h2 id="task-dialog-title" className="h5 fw-bold mb-0">
            <i
              className={`bi ${editingTask ? 'bi-pencil-square' : 'bi-plus-circle-fill'} me-2`}
              aria-hidden="true"
            ></i>
            {editingTask ? 'Update Academic Task' : 'Create New Academic Task'}
          </h2>
          <button
            type="button"
            className="btn-close btn-close-white"
            aria-label="Close modal"
            onClick={() => dialogRef.current?.close()}
          />
        </div>

        <form
          ref={formRef}
          id="academic-task-form"
          method="POST"
          action="/api/tasks"
          noValidate
          onSubmit={handleSubmit}
          onBlur={handleFieldBlur}
          className="p-4"
        >
          {formError && (
            <div className="alert alert-danger d-flex align-items-center gap-2 py-2" role="alert" aria-live="polite">
              <i className="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
              <span>{formError}</span>
            </div>
          )}

          <div className="row g-3">
            {/* Title */}
            <div className="col-12">
              <label htmlFor="task-title" className="form-label fw-semibold mb-1">
                Task / Assignment Title <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                id="task-title"
                name="title"
                className="form-control"
                placeholder="e.g., Implement B-Tree Indexing Engine"
                required
                maxLength={120}
                autoFocus
                value={formData.title}
                onChange={handleFieldChange}
                aria-errormessage="title-error"
              />
              <div id="title-error" className="error-msg">
                <span aria-hidden="true">❌</span> Please enter an academic task or assignment title.
              </div>
            </div>

            {/* Subject & Category */}
            <div className="col-12 col-md-6">
              <label htmlFor="task-subject" className="form-label fw-semibold mb-1">
                Academic Subject / Course <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                id="task-subject"
                name="subject"
                list="subject-suggestions"
                className="form-control"
                placeholder="e.g., Database Systems"
                required
                maxLength={80}
                value={formData.subject}
                onChange={handleFieldChange}
                aria-errormessage="subject-error"
              />
              <datalist id="subject-suggestions">
                {existingSubjects.map((subj) => (
                  <option key={subj} value={subj} />
                ))}
              </datalist>
              <div id="subject-error" className="error-msg">
                <span aria-hidden="true">❌</span> Subject name is required.
              </div>
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="task-category" className="form-label fw-semibold mb-1">
                Task Category
              </label>
              <select
                id="task-category"
                name="category"
                className="form-select"
                value={formData.category}
                onChange={handleFieldChange}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Deadline & Estimated Effort */}
            <div className="col-12 col-md-6">
              <label htmlFor="task-deadline" className="form-label fw-semibold mb-1">
                Due Date (Deadline) <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                id="task-deadline"
                name="deadline"
                className="form-control"
                required
                value={formData.deadline}
                onChange={handleFieldChange}
                aria-errormessage="deadline-error"
              />
              <div id="deadline-error" className="error-msg">
                <span aria-hidden="true">❌</span> Please select a valid due date.
              </div>
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="task-hours" className="form-label fw-semibold mb-1">
                Estimated Study Hours
              </label>
              <input
                type="number"
                id="task-hours"
                name="estimatedHours"
                className="form-control"
                min="0.5"
                max="200"
                step="0.5"
                value={formData.estimatedHours}
                onChange={handleFieldChange}
              />
            </div>

            {/* Priority Radio Group (3 options -> visible radio buttons per forms guide) */}
            <div className="col-12 col-md-6">
              <fieldset className="border rounded-3 p-3 h-100">
                <legend className="float-none w-auto px-2 small fw-bold text-secondary mb-0">
                  Priority Level
                </legend>
                <div className="d-flex gap-3 flex-wrap pt-1">
                  {PRIORITIES.map((priorityOption) => (
                    <div className="form-check" key={priorityOption}>
                      <input
                        className="form-check-input"
                        type="radio"
                        name="priority"
                        id={`priority-${priorityOption}`}
                        value={priorityOption}
                        checked={formData.priority === priorityOption}
                        onChange={handleFieldChange}
                      />
                      <label className="form-check-label" htmlFor={`priority-${priorityOption}`}>
                        {priorityOption}
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>
            </div>

            {/* Status Radio Group (3 options -> visible radio buttons per forms guide) */}
            <div className="col-12 col-md-6">
              <fieldset className="border rounded-3 p-3 h-100">
                <legend className="float-none w-auto px-2 small fw-bold text-secondary mb-0">
                  Current Status
                </legend>
                <div className="d-flex gap-3 flex-wrap pt-1">
                  {STATUSES.map((statusOption) => (
                    <div className="form-check" key={statusOption}>
                      <input
                        className="form-check-input"
                        type="radio"
                        name="status"
                        id={`status-${statusOption.replace(/\s+/g, '-')}`}
                        value={statusOption}
                        checked={formData.status === statusOption}
                        onChange={handleFieldChange}
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`status-${statusOption.replace(/\s+/g, '-')}`}
                      >
                        {statusOption}
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>
            </div>

            {/* Description / Notes */}
            <div className="col-12">
              <label htmlFor="task-description" className="form-label fw-semibold mb-1">
                Instructions, Deliverables & Notes
              </label>
              <textarea
                id="task-description"
                name="description"
                className="form-control"
                rows={3}
                maxLength={1000}
                placeholder="Add chapter references, submission link, or grading rubric notes..."
                value={formData.description}
                onChange={handleFieldChange}
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button
              type="button"
              className="btn btn-light border px-4"
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary px-4 fw-semibold" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                  Saving...
                </>
              ) : editingTask ? (
                'Save Task Changes'
              ) : (
                'Create Academic Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

