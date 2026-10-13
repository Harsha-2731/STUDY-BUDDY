const mongoose = require('mongoose');

const studentProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  branch: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: String,
    required: true,
    trim: true
  },
  semester: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'completed'
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

studentProgressSchema.index({ user: 1, subject: 1, topic: 1 }, { unique: true });

module.exports = mongoose.models.StudentProgress || mongoose.model('StudentProgress', studentProgressSchema);
