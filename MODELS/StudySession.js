const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subject: {
    type: String,
    default: 'General',
    trim: true
  },
  topic: {
    type: String,
    default: '',
    trim: true
  },
  durationMinutes: {
    type: Number,
    required: true,
    min: 1
  },
  sessionType: {
    type: String,
    enum: ['pomodoro', 'short_break', 'long_break', 'focus'],
    default: 'pomodoro'
  },
  completed: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

studySessionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.models.StudySession || mongoose.model('StudySession', studySessionSchema);
