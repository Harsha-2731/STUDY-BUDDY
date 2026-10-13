const mongoose = require('mongoose');

const listSchema = new mongoose.Schema({
  branch: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  year: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  semester: {
    type: String,
    required: true,
    default: '1st sem',
    index: true,
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
    default: '1st unit',
    trim: true
  },
  topic: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  link: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['pdf', 'video', 'link', 'drive', 'notes', 'image'],
    default: 'drive'
  },
  description: {
    type: String,
    default: ''
  },
  fileSize: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, { timestamps: true });

// Compound indexes for high performance academic browsing
listSchema.index({ branch: 1, year: 1, semester: 1, subject: 1 });
listSchema.index({ subject: 1, unit: 1 });
listSchema.index({ topic: 'text', subject: 'text', description: 'text' });

module.exports = mongoose.models.List || mongoose.model('List', listSchema);
