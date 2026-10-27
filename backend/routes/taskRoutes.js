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

    const completedHours = tasks
      .filter((t) => t.status === 'Completed')
      .reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0);

    const totalEstimatedHours = totalEstimatedHoursRemaining + completedHours;

    // 7-day upcoming deadline horizon
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const upcomingTimeline = Array.from({ length: 7 }, (_, offset) => {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const isoDate = `${yyyy}-${mm}-${dd}`;

      const dayTasks = tasks.filter((t) => t.deadline === isoDate);
      const activeDayTasks = dayTasks.filter((t) => t.status !== 'Completed');
      const hours = activeDayTasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0);

      return {
        date: isoDate,
        dayName: offset === 0 ? 'Today' : offset === 1 ? 'Tmrw' : dayNames[d.getDay()],
        shortDate: `${mm}/${dd}`,
        totalTasks: dayTasks.length,
        activeTasks: activeDayTasks.length,
        completedTasks: dayTasks.length - activeDayTasks.length,
        hours: Number(hours.toFixed(1))
      };
    });

    // Breakdown by subject
    const subjectMap = {};
    for (const task of tasks) {
      const taskHours = Number(task.estimatedHours) || 0;
      if (!subjectMap[task.subject]) {
        subjectMap[task.subject] = {
          subject: task.subject,
          total: 0,
          completed: 0,
          inProgress: 0,
          pending: 0,
          hoursRemaining: 0,
          hoursCompleted: 0,
          totalHours: 0
        };
      }
      subjectMap[task.subject].total += 1;
      subjectMap[task.subject].totalHours = Number(
        (subjectMap[task.subject].totalHours + taskHours).toFixed(1)
      );
      if (task.status === 'Completed') {
        subjectMap[task.subject].completed += 1;
        subjectMap[task.subject].hoursCompleted = Number(
          (subjectMap[task.subject].hoursCompleted + taskHours).toFixed(1)
        );
      } else if (task.status === 'In Progress') {
        subjectMap[task.subject].inProgress += 1;
        subjectMap[task.subject].hoursRemaining = Number(
          (subjectMap[task.subject].hoursRemaining + taskHours).toFixed(1)
        );
      } else {
        subjectMap[task.subject].pending += 1;
        subjectMap[task.subject].hoursRemaining = Number(
          (subjectMap[task.subject].hoursRemaining + taskHours).toFixed(1)
        );
      }
    }

    // Breakdown by priority (counts and active hours)
    const priorityBreakdown = {
      High: tasks.filter((t) => t.priority === 'High').length,
      Medium: tasks.filter((t) => t.priority === 'Medium').length,
      Low: tasks.filter((t) => t.priority === 'Low').length
    };

    const priorityHoursBreakdown = {
      High: Number(
        activeTasks
          .filter((t) => t.priority === 'High')
          .reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0)
          .toFixed(1)
      ),
      Medium: Number(
        activeTasks
          .filter((t) => t.priority === 'Medium')
          .reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0)
          .toFixed(1)
      ),
      Low: Number(
        activeTasks
          .filter((t) => t.priority === 'Low')
          .reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0)
          .toFixed(1)
      )
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
      completedHours: Number(completedHours.toFixed(1)),
      totalEstimatedHours: Number(totalEstimatedHours.toFixed(1)),
      overdueTasks,
      approachingTasks,
      upcomingTimeline,
      subjectBreakdown: Object.values(subjectMap),
      priorityBreakdown,
      priorityHoursBreakdown,
      categoryBreakdown
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
