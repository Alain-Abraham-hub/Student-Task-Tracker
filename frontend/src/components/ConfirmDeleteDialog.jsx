import React, { useEffect, useRef } from 'react';

export default function ConfirmDeleteDialog({ task, onCancel, onConfirm, isDeleting }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (task) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [task]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = '';
      onCancel();
    };
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onCancel]);

  return (
    <dialog
      ref={dialogRef}
      id="confirm-delete-dialog"
      closedby="closerequest"
      aria-labelledby="confirm-delete-title"
      className="custom-confirm-dialog border-0 rounded-4 shadow-lg p-0"
    >
      <div className="p-4">
        <div className="d-flex align-items-center gap-3 mb-3">
          <div className="bg-danger bg-opacity-10 text-danger rounded-circle p-3 d-inline-flex align-items-center justify-content-center">
            <i className="bi bi-trash3-fill fs-4" aria-hidden="true"></i>
          </div>
          <div>
            <h2 id="confirm-delete-title" className="h5 fw-bold mb-1">
              Delete Academic Task?
            </h2>
            <p className="text-muted small mb-0">This action cannot be undone.</p>
          </div>
        </div>

        {task && (
          <div className="p-3 bg-light rounded-3 border mb-4">
            <div className="fw-bold text-dark">{task.title}</div>
            <div className="small text-muted mt-1">
              {task.subject} • {task.category} • Due {task.deadline}
            </div>
          </div>
        )}

        <div className="d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn btn-light border px-4"
            autoFocus
            onClick={() => dialogRef.current?.close()}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger px-4 fw-semibold"
            disabled={isDeleting}
            onClick={() => task && onConfirm(task._id)}
          >
            {isDeleting ? 'Deleting...' : 'Delete Task'}
          </button>
        </div>
      </div>
    </dialog>
  );
}

