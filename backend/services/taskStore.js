const mongoose = require('mongoose');
const Task = require('../models/Task');

const listTasks = async (filters = {}) => {
  const { subject, priority, status, category, search } = filters;

  const query = {};
  if (subject && subject !== 'All') query.subject = subject;
  if (priority && priority !== 'All') query.priority = priority;
  if (status && status !== 'All') query.status = status;
  if (category && category !== 'All') query.category = category;
  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [{ title: regex }, { subject: regex }, { description: regex }];
  }

  return Task.find(query).sort({ deadline: 1, createdAt: -1 }).lean();
};

const getTaskById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return Task.findById(id).lean();
};

const createTask = async (payload) => {
  const created = await Task.create({
    title: payload.title?.trim(),
    subject: payload.subject?.trim(),
    category: payload.category || 'Assignment',
    priority: payload.priority || 'Medium',
    status: payload.status || 'Pending',
    deadline: payload.deadline,
    description: payload.description ? payload.description.trim() : '',
    estimatedHours: Number(payload.estimatedHours) || 2
  });
  return created.toObject();
};

const updateTask = async (id, payload) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return Task.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true }
  ).lean();
};

const deleteTask = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return Task.findByIdAndDelete(id).lean();
};

module.exports = {
  listTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
};
