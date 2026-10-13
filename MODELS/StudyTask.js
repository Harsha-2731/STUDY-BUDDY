const mongoose = require('mongoose');

const studyTaskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  subject: {
    type: String,
    default: 'General',
    trim: true
  },
  dueDate: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  }
}, { timestamps: true });

studyTaskSchema.index({ user: 1, status: 1, dueDate: 1 });

module.exports = mongoose.models.StudyTask || mongoose.model('StudyTask', studyTaskSchema);
