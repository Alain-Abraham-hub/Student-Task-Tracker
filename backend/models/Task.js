const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    subject: {
      type: String,
      required: [true, 'Academic subject is required'],
      trim: true,
      maxlength: [80, 'Subject cannot exceed 80 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Assignment', 'Exam', 'Project', 'Lab', 'Reading', 'Quiz', 'Presentation', 'Other'],
        message: '{VALUE} is not a supported category'
      },
      default: 'Assignment'
    },
    priority: {
      type: String,
      required: [true, 'Priority level is required'],
      enum: {
        values: ['High', 'Medium', 'Low'],
        message: '{VALUE} is not a valid priority'
      },
      default: 'Medium'
    },
    status: {
      type: String,
      required: [true, 'Task status is required'],
      enum: {
        values: ['Pending', 'In Progress', 'Completed'],
        message: '{VALUE} is not a valid status'
      },
      default: 'Pending'
    },
    deadline: {
      type: String,
      required: [true, 'Deadline date (YYYY-MM-DD) is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Deadline must be in YYYY-MM-DD format']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: ''
    },
    estimatedHours: {
      type: Number,
      min: [0.5, 'Estimated hours must be at least 0.5'],
      max: [200, 'Estimated hours cannot exceed 200'],
      default: 2
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Task', taskSchema);

