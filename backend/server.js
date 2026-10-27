const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const taskRoutes = require('./routes/taskRoutes');
const taskStore = require('./services/taskStore');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_task_tracker';

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    storageEngine: taskStore.getStorageEngineName(),
    timestamp: new Date().toISOString()
  });
});

// Mount task routes
app.use('/api/tasks', taskRoutes);

// Centralized error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error'
  });
});

const connectDBAndStart = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 2500
    });
    console.log(`Connected to MongoDB at ${MONGODB_URI}`);
  } catch (err) {
    console.warn(
      `MongoDB connection unavailable (${err.message}). Using Mongoose schema validation with local JSON persistence fallback.`
    );
  }

  if (require.main === module) {
    app.listen(PORT, () => {
      console.log(`Student Task Tracker API running on http://localhost:${PORT}`);
    });
  }
};

connectDBAndStart();

module.exports = app;

