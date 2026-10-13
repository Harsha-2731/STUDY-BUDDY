const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../MODELS/User');
const List = require('../MODELS/List');
const StudyTask = require('../MODELS/StudyTask');
const StudySession = require('../MODELS/StudySession');
const Notification = require('../MODELS/Notification');
const StudentProgress = require('../MODELS/StudentProgress');
const jsonData = require('./study_data.json');

const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/Study_Buddy';

async function seedDatabase() {
  console.log(`Connecting to MongoDB at: ${mongoUrl.replace(/:[^:]*@/, ':****@')}`);
  await mongoose.connect(mongoUrl);
  console.log('Connected to MongoDB.');

  // Create demo admin and demo student
  const studentPassword = await bcrypt.hash('Student@123', 10);
  const adminPassword = await bcrypt.hash('Admin@123', 10);

  let demoStudent = await User.findOne({ userEmail: 'student@studybuddy.edu' });
  if (!demoStudent) {
    demoStudent = new User({
      userName: 'HARSHA VARDHAN',
      userEmail: 'student@studybuddy.edu',
      userPassword: studentPassword,
      studentRole: 'student',
      academicBranch: 'CSE',
      academicYear: '2nd Year',
      academicSemester: '1st sem',
      favoriteSubjects: ['DS', 'M1', 'PHYSICS'],
      onboardingCompleted: true,
      themePreference: 'light'
    });
    await demoStudent.save();
    console.log('Created Demo Student (student@studybuddy.edu / Student@123)');
  }

  let demoAdmin = await User.findOne({ userEmail: 'admin@studybuddy.edu' });
  if (!demoAdmin) {
    demoAdmin = new User({
      userName: 'STUDYBUDDY ADMIN',
      userEmail: 'admin@studybuddy.edu',
      userPassword: adminPassword,
      studentRole: 'admin',
      academicBranch: 'CSE',
      academicYear: '4th Year',
      academicSemester: '2nd sem',
      favoriteSubjects: ['AI', 'CLOUD'],
      onboardingCompleted: true,
      themePreference: 'dark'
    });
    await demoAdmin.save();
    console.log('Created Demo Admin (admin@studybuddy.edu / Admin@123)');
  }

  // Seed academic resources if List is empty or has fewer than 100 docs
  const existingCount = await List.countDocuments();
  console.log(`Current academic resources count: ${existingCount}`);

  if (existingCount < jsonData.length) {
    console.log(`Clearing old records and inserting ${jsonData.length} academic resources from study_data.json...`);
    await List.deleteMany({});
    
    // Prepare data with addedBy pointing to valid admin id
    const formattedData = jsonData.map(item => ({
      ...item,
      branch: (item.branch || 'CSE').trim().toUpperCase(),
      year: (item.year || '1st Year').trim(),
      semester: (item.semester || '1st sem').trim(),
      subject: (item.subject || 'General').trim().toUpperCase(),
      unit: (item.unit || '1st unit').trim(),
      topic: (item.topic || `${item.subject} Note`).trim(),
      link: item.link || '#',
      type: item.link && item.link.includes('drive.google.com') ? 'drive' : (item.link && item.link.endsWith('.pdf') ? 'pdf' : 'link'),
      isPublic: true,
      addedBy: demoAdmin._id
    }));

    // Insert in batches of 300
    const chunkSize = 300;
    for (let i = 0; i < formattedData.length; i += chunkSize) {
      const chunk = formattedData.slice(i, i + chunkSize);
      await List.insertMany(chunk);
      console.log(`Inserted chunk ${i + 1} to ${Math.min(i + chunkSize, formattedData.length)}`);
    }
    console.log(`Successfully seeded ${formattedData.length} academic resources!`);
  } else {
    console.log(`Academic resources already populated (${existingCount} items).`);
  }

  // Seed sample tasks and sessions for demo student if empty
  const taskCount = await StudyTask.countDocuments({ user: demoStudent._id });
  if (taskCount === 0) {
    const tomorrow = new Date(Date.now() + 86400000);
    const nextWeek = new Date(Date.now() + 86400000 * 5);
    await StudyTask.insertMany([
      {
        user: demoStudent._id,
        title: 'Complete Data Structures Unit 2 Notes',
        description: 'Review trees and binary search tree algorithms',
        subject: 'DS',
        dueDate: tomorrow,
        priority: 'high',
        status: 'in_progress'
      },
      {
        user: demoStudent._id,
        title: 'Revise Mathematics-1 Calculus Theorems',
        description: 'Practice Mean Value Theorem and Taylor Series problems',
        subject: 'M1',
        dueDate: nextWeek,
        priority: 'medium',
        status: 'pending'
      },
      {
        user: demoStudent._id,
        title: 'Physics Wave Optics Summary',
        description: 'Read Interference and Diffraction unit notes',
        subject: 'PHYSICS',
        dueDate: new Date(Date.now() - 86400000),
        priority: 'low',
        status: 'completed'
      }
    ]);
    console.log('Seeded sample study tasks.');
  }

  const sessionCount = await StudySession.countDocuments({ user: demoStudent._id });
  if (sessionCount === 0) {
    await StudySession.insertMany([
      {
        user: demoStudent._id,
        subject: 'DS',
        topic: 'Binary Search Trees',
        durationMinutes: 25,
        sessionType: 'pomodoro',
        completed: true
      },
      {
        user: demoStudent._id,
        subject: 'M1',
        topic: 'Matrices & Eigenvalues',
        durationMinutes: 30,
        sessionType: 'pomodoro',
        completed: true
      }
    ]);
    console.log('Seeded sample study sessions.');
  }

  const progressCount = await StudentProgress.countDocuments({ user: demoStudent._id });
  if (progressCount === 0) {
    await StudentProgress.insertMany([
      {
        user: demoStudent._id,
        branch: 'CSE',
        year: '1st Year',
        semester: '1st sem',
        subject: 'M1',
        unit: '1st unit',
        topic: 'M1 - 1st unit',
        status: 'completed'
      },
      {
        user: demoStudent._id,
        branch: 'CSE',
        year: '1st Year',
        semester: '1st sem',
        subject: 'M1',
        unit: '2nd unit',
        topic: 'M1 - 2nd unit',
        status: 'completed'
      },
      {
        user: demoStudent._id,
        branch: 'CSE',
        year: '1st Year',
        semester: '1st sem',
        subject: 'CHEMISTRY',
        unit: '1st unit',
        topic: 'CHEMISTRY - 1st unit',
        status: 'in_progress'
      }
    ]);
    console.log('Seeded sample syllabus progress.');
  }

  const notifCount = await Notification.countDocuments({ user: demoStudent._id });
  if (notifCount === 0) {
    await Notification.insertMany([
      {
        user: demoStudent._id,
        title: 'Welcome to StudyBuddy!',
        message: 'Your engineering workspace is ready. Explore subjects, notes, and track your progress.',
        type: 'system',
        read: false
      },
      {
        user: demoStudent._id,
        title: 'Syllabus Tracker Active',
        message: 'You have completed 2 topics in Mathematics-1. Keep going!',
        type: 'success',
        read: false
      }
    ]);
    console.log('Seeded sample notifications.');
  }

  // Add sample bookmarks for demo student
  const sampleResources = await List.find().limit(3);
  if (sampleResources.length > 0) {
    demoStudent.bookmarks = sampleResources.map(r => r._id);
    demoStudent.favorites = sampleResources.map(r => r._id);
    await demoStudent.save();
    console.log('Added initial bookmarks to demo student.');
  }

  console.log('Database seeding finished successfully!');
  await mongoose.disconnect();
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = seedDatabase;
