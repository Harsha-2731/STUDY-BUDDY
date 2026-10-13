const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  userEmail: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/\S+@\S+\.\S+/, 'Please use a valid email address']
  },
  userPassword: {
    type: String,
    required: true,
    minlength: 6,
    trim: true
  },
  studentRole: {
    type: String,
    required: true,
    enum: ['student', 'admin'],
    default: 'student'
  },
  academicBranch: {
    type: String,
    enum: ['CSE', 'AIML', 'CIC', 'IT', 'AIDS', 'CSIT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'OTHER'],
    default: 'CSE'
  },
  academicYear: {
    type: String,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    default: '1st Year'
  },
  academicSemester: {
    type: String,
    enum: ['1st sem', '2nd sem'],
    default: '1st sem'
  },
  favoriteSubjects: [{
    type: String
  }],
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'List'
  }],
  // Kept for backward compatibility
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'List'
  }],
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  themePreference: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system'
  },
  resetToken: String,
  resetTokenHash: String,
  resetTokenExpiry: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
