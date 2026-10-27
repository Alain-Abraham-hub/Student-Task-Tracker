const express = require('express');
const router = express.Router();
const taskStore = require('../services/taskStore');

// Helper to compute days difference from YYYY-MM-DD relative to today
const getDaysUntilDeadline = (deadlineStr) => {
  const today = new Date();
  const todayMidnight = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const [year, month, day] = String(deadlineStr).split('-').map(Number);
  if (!year || !month || !day) return 0;
  const targetMidnight = Date.UTC(year, month - 1, day);
  return Math.round((targetMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
};

// GET /api/tasks/stats - Dashboard workload summary & statistics
router.get('/stats', async (req, res, next) => {
  try {
    const tasks = await taskStore.listTasks({});
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === 'Pending').length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Active (non-completed) tasks analyzed for urgency
    const activeTasks = tasks.filter((t) => t.status !== 'Completed');

    const overdueTasks = activeTasks.filter((t) => getDaysUntilDeadline(t.deadline) < 0);
    const approachingTasks = activeTasks.filter((t) => {
      const days = getDaysUntilDeadline(t.deadline);
      return days >= 0 && days <= 3;
    });

    const highPriorityPending = activeTasks.filter((t) => t.priority === 'High').length;

    const totalEstimatedHoursRemaining = activeTasks.reduce(
      (sum, t) => sum + (Number(t.estimatedHours) || 0),
      0
    );

    // Breakdown by subject
    const subjectMap = {};
    for (const task of tasks) {
      if (!subjectMap[task.subject]) {
        subjectMap[task.subject] = {
          subject: task.subject,
          total: 0,
          completed: 0,
          inProgress: 0,
          pending: 0,
          hoursRemaining: 0
        };
      }
      subjectMap[task.subject].total += 1;
      if (task.status === 'Completed') {
        subjectMap[task.subject].completed += 1;
      } else if (task.status === 'In Progress') {
        subjectMap[task.subject].inProgress += 1;
        subjectMap[task.subject].hoursRemaining += Number(task.estimatedHours) || 0;
      } else {
        subjectMap[task.subject].pending += 1;
        subjectMap[task.subject].hoursRemaining += Number(task.estimatedHours) || 0;
      }
    }

    // Breakdown by priority
    const priorityBreakdown = {
      High: tasks.filter((t) => t.priority === 'High').length,
      Medium: tasks.filter((t) => t.priority === 'Medium').length,
      Low: tasks.filter((t) => t.priority === 'Low').length
    };

    // Breakdown by category
    const categoryBreakdown = tasks.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {});

    res.json({
      total,
      pending,
      inProgress,
      completed,
      completionRate,
      overdueCount: overdueTasks.length,
      approachingCount: approachingTasks.length,
      highPriorityPending,
      totalEstimatedHoursRemaining: Number(totalEstimatedHoursRemaining.toFixed(1)),
      overdueTasks,
      approachingTasks,
      subjectBreakdown: Object.values(subjectMap),
      priorityBreakdown,
      categoryBreakdown,
      storageEngine: taskStore.getStorageEngineName()
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks - Retrieve tasks with optional filters (subject, priority, status, category, search)
router.get('/', async (req, res, next) => {
  try {
    const { subject, priority, status, category, search } = req.query;
    const tasks = await taskStore.listTasks({ subject, priority, status, category, search });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks/seed - Reset and seed realistic academic tasks
router.post('/seed', async (req, res, next) => {
  try {
    const seeded = await taskStore.resetAndSeedTasks();
    res.status(201).json({
      message: 'Sample academic workload seeded successfully',
      count: seeded.length,
      tasks: seeded
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:id - Retrieve a single task by ID
router.get('/:id', async (req, res, next) => {
  try {
    const task = await taskStore.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks - Create a new academic task
router.post('/', async (req, res, next) => {
  try {
    const created = await taskStore.createTask(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/:id - Update an existing task
router.put('/:id', async (req, res, next) => {
  try {
    const updated = await taskStore.updateTask(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tasks/:id/status - Quick status transition (Pending -> In Progress -> Completed)
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status field is required' });
    }
    const updated = await taskStore.updateTask(req.params.id, { status });
    if (!updated) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await taskStore.deleteTask(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully', task: deleted });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

