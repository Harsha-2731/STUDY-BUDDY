const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  filename: { 
    type: String, 
    required: true 
  },
  fileType: { 
    type: String, 
    enum: ['pdf', 'image', 'text', 'other'], 
    default: 'pdf' 
  },
  content: { 
    type: String, 
    default: '' 
  },
  fileSize: { 
    type: Number, 
    default: 0 
  },
  originalName: { 
    type: String, 
    default: '' 
  },
  subject: { 
    type: String, 
    default: 'General' 
  },
  branch: { 
    type: String, 
    default: 'CSE' 
  },
  year: { 
    type: String, 
    default: '1st Year' 
  },
  semester: { 
    type: String, 
    default: '1st sem' 
  },
  unit: { 
    type: String, 
    default: '1st unit' 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  }
}, { timestamps: true });

module.exports = mongoose.models.Upload || mongoose.model('Upload', uploadSchema);