const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Task = require('../models/Task');

const FALLBACK_FILE = path.join(__dirname, '..', 'data', 'tasks.json');

const getDefaultSeedTasks = () => {
  const today = new Date();
  const formatISO = (offsetDays) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      _id: 'seed-task-1',
      title: 'Implement B-Tree Indexing Engine',
      subject: 'Database Systems',
      category: 'Project',
      priority: 'High',
      status: 'In Progress',
      deadline: formatISO(1),
      description: 'Complete node splitting, range scan iterator, and buffer pool pinning for the storage engine module.',
      estimatedHours: 8,
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      _id: 'seed-task-2',
      title: 'Midterm Exam: Dynamic Programming & Graphs',
      subject: 'Algorithms',
      category: 'Exam',
      priority: 'High',
      status: 'Pending',
      deadline: formatISO(2),
      description: 'Review Bellman-Ford, Floyd-Warshall, network flow, and NP-completeness reductions (Chapters 24-34).',
      estimatedHours: 6,
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      _id: 'seed-task-3',
      title: 'TCP Congestion Control Lab Report',
      subject: 'Computer Networks',
      category: 'Lab',
      priority: 'Medium',
      status: 'Pending',
      deadline: formatISO(4),
      description: 'Analyze Wireshark packet traces comparing TCP Reno and CUBIC throughput under simulated 2% packet loss.',
      estimatedHours: 3.5,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
      _id: 'seed-task-4',
      title: 'Problem Set 5: Eigenvalues & SVD',
      subject: 'Linear Algebra',
      category: 'Assignment',
      priority: 'Medium',
      status: 'Pending',
      deadline: formatISO(-1),
      description: 'Complete exercises 5.1 through 5.8 and submit MATLAB/Python verification notebook on the LMS portal.',
      estimatedHours: 4,
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
      _id: 'seed-task-5',
      title: 'Read Transformer Architecture Paper',
      subject: 'Machine Learning',
      category: 'Reading',
      priority: 'Low',
      status: 'Completed',
      deadline: formatISO(-3),
      description: 'Summarize multi-head self-attention equations and positional encoding trade-offs for seminar discussion.',
      estimatedHours: 2,
      createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      _id: 'seed-task-6',
      title: 'REST API & MongoDB Integration Demo',
      subject: 'Web Engineering',
      category: 'Presentation',
      priority: 'High',
      status: 'In Progress',
      deadline: formatISO(0),
      description: 'Prepare slide deck and live demonstration of CRUD operations, workload statistics, and responsive UI.',
      estimatedHours: 3,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
};

const ensureFallbackFile = () => {
  const dir = path.dirname(FALLBACK_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(FALLBACK_FILE)) {
    const initial = getDefaultSeedTasks();
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(initial, null, 2), 'utf8');
  }
};

const readFallbackTasks = () => {
  ensureFallbackFile();
  try {
    const raw = fs.readFileSync(FALLBACK_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return getDefaultSeedTasks();
  }
};

const writeFallbackTasks = (tasks) => {
  ensureFallbackFile();
  fs.writeFileSync(FALLBACK_FILE, JSON.stringify(tasks, null, 2), 'utf8');
};

const isMongoConnected = () => mongoose.connection.readyState === 1;

const validateTaskPayload = (payload, isPartial = false) => {
  const cleanPayload = { ...payload };
  delete cleanPayload._id;
  delete cleanPayload.createdAt;
  delete cleanPayload.updatedAt;
  delete cleanPayload.__v;

  const doc = new Task(cleanPayload);
  const err = doc.validateSync();
  if (!err) return null;

  if (isPartial) {
    const relevantErrors = Object.keys(err.errors).filter((key) => key in cleanPayload);
    if (relevantErrors.length === 0) return null;
    return relevantErrors.map((k) => err.errors[k].message).join('; ');
  }

  return Object.values(err.errors)
    .map((e) => e.message)
    .join('; ');
};

const listTasks = async (filters = {}) => {
  const { subject, priority, status, category, search } = filters;

  if (isMongoConnected()) {
    const count = await Task.countDocuments();
    if (count === 0 && !subject && !priority && !status && !category && !search) {
      const seeds = getDefaultSeedTasks().map(({ _id, ...rest }) => rest);
      await Task.insertMany(seeds);
    }

    const query = {};
    if (subject && subject !== 'All') query.subject = subject;
    if (priority && priority !== 'All') query.priority = priority;
    if (status && status !== 'All') query.status = status;
    if (category && category !== 'All') query.category = category;
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { subject: regex }, { description: regex }];
    }

    const docs = await Task.find(query).sort({ deadline: 1, createdAt: -1 }).lean();
    return docs;
  }

  let tasks = readFallbackTasks();
  if (subject && subject !== 'All') {
    tasks = tasks.filter((t) => t.subject.toLowerCase() === subject.toLowerCase());
  }
  if (priority && priority !== 'All') {
    tasks = tasks.filter((t) => t.priority === priority);
  }
  if (status && status !== 'All') {
    tasks = tasks.filter((t) => t.status === status);
  }
  if (category && category !== 'All') {
    tasks = tasks.filter((t) => t.category === category);
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    tasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }

  return tasks.sort((a, b) => a.deadline.localeCompare(b.deadline));
};

const getTaskById = async (id) => {
  if (isMongoConnected()) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Task.findById(id).lean();
  }
  const tasks = readFallbackTasks();
  return tasks.find((t) => String(t._id) === String(id)) || null;
};

const createTask = async (payload) => {
  const validationError = validateTaskPayload(payload, false);
  if (validationError) {
    const error = new Error(validationError);
    error.statusCode = 400;
    throw error;
  }

  if (isMongoConnected()) {
    const created = await Task.create({
      title: payload.title.trim(),
      subject: payload.subject.trim(),
      category: payload.category || 'Assignment',
      priority: payload.priority || 'Medium',
      status: payload.status || 'Pending',
      deadline: payload.deadline,
      description: payload.description ? payload.description.trim() : '',
      estimatedHours: Number(payload.estimatedHours) || 2
    });
    return created.toObject();
  }

  const tasks = readFallbackTasks();
  const now = new Date().toISOString();
  const newTask = {
    _id: crypto.randomUUID(),
    title: payload.title.trim(),
    subject: payload.subject.trim(),
    category: payload.category || 'Assignment',
    priority: payload.priority || 'Medium',
    status: payload.status || 'Pending',
    deadline: payload.deadline,
    description: payload.description ? payload.description.trim() : '',
    estimatedHours: Number(payload.estimatedHours) || 2,
    createdAt: now,
    updatedAt: now
  };
  tasks.push(newTask);
  writeFallbackTasks(tasks);
  return newTask;
};

const updateTask = async (id, payload) => {
  const validationError = validateTaskPayload(payload, true);
  if (validationError) {
    const error = new Error(validationError);
    error.statusCode = 400;
    throw error;
  }

  if (isMongoConnected()) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const updated = await Task.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true }
    ).lean();
    return updated;
  }

  const tasks = readFallbackTasks();
  const index = tasks.findIndex((t) => String(t._id) === String(id));
  if (index === -1) return null;

  const updatedTask = {
    ...tasks[index],
    ...payload,
    updatedAt: new Date().toISOString()
  };

  const fullError = validateTaskPayload(updatedTask, false);
  if (fullError) {
    const error = new Error(fullError);
    error.statusCode = 400;
    throw error;
  }

  tasks[index] = updatedTask;
  writeFallbackTasks(tasks);
  return updatedTask;
};

const deleteTask = async (id) => {
  if (isMongoConnected()) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Task.findByIdAndDelete(id).lean();
  }

  const tasks = readFallbackTasks();
  const index = tasks.findIndex((t) => String(t._id) === String(id));
  if (index === -1) return null;

  const [removed] = tasks.splice(index, 1);
  writeFallbackTasks(tasks);
  return removed;
};

const resetAndSeedTasks = async () => {
  const seeds = getDefaultSeedTasks();
  if (isMongoConnected()) {
    await Task.deleteMany({});
    const inserted = await Task.insertMany(seeds.map(({ _id, ...rest }) => rest));
    return inserted.map((doc) => doc.toObject());
  }
  writeFallbackTasks(seeds);
  return seeds;
};

const getStorageEngineName = () =>
  isMongoConnected() ? 'MongoDB (MongooseConnected)' : 'MongoDB Schema + Local JSON Persistence (Offline Fallback)';

module.exports = {
  listTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  resetAndSeedTasks,
  getStorageEngineName
};
