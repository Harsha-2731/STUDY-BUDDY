const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');

// Load environment configuration
dotenv.config();

// Mongoose Models
const User = require('./MODELS/User');
const List = require('./MODELS/List');
const Resource = require('./MODELS/Resource'); // Unified alias for List
const Upload = require('./MODELS/Upload');
const StudentProgress = require('./MODELS/StudentProgress');
const StudyTask = require('./MODELS/StudyTask');
const StudySession = require('./MODELS/StudySession');
const Notification = require('./MODELS/Notification');

const app = express();

// Configure static uploads directory (ensuring case-consistency)
const uploadDir = path.join(__dirname, 'PUBLIC', 'upload');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${safeExt}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExts = /pdf|jpeg|jpg|png|txt/;
  const isExtValid = allowedExts.test(path.extname(file.originalname).toLowerCase());
  const isMimeValid = file.mimetype.includes('pdf') || 
                      file.mimetype.includes('image') || 
                      file.mimetype.includes('text');

  if (isExtValid && isMimeValid) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF documents, images (JPEG, PNG), and text notes are allowed!'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter
});

// View Engine & Static Assets
app.set('views', path.join(__dirname, 'VIEWS'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'PUBLIC')));
app.use('/upload', express.static(uploadDir));
app.use(bodyParser.urlencoded({ extended: true, limit: '20mb' }));
app.use(bodyParser.json({ limit: '20mb' }));

// CORS & Security Headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/Study_Buddy';
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected to Study_Buddy'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err.message));

// Session Setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'studybuddy_ultra_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
  })
);

// Global Middleware: Attach user & notification count to all view renders
app.use(async (req, res, next) => {
  res.locals.user = null;
  res.locals.unreadCount = 0;

  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId).lean();
      if (user) {
        req.session.user = user;
        res.locals.user = user;
        const unread = await Notification.countDocuments({ user: user._id, read: false });
        res.locals.unreadCount = unread;
      }
    } catch (e) {
      console.error('Session user fetch error:', e.message);
    }
  }
  next();
});

// Authentication Guard Middleware
function requireAuth(req, res, next) {
  if (req.session.userId && req.session.user) {
    return next();
  }
  res.redirect('/login');
}

// Administrator Guard Middleware
function requireAdmin(req, res, next) {
  if (req.session.userId && req.session.user && req.session.user.studentRole === 'admin') {
    return next();
  }
  res.status(403).render('error', {
    user: req.session.user || null,
    error: 'Access denied: Administrator privileges required.'
  });
}

// Supported Engineering Branches
const SUPPORTED_BRANCHES = ['CSE', 'AIML', 'AIDS', 'IT', 'CSIT', 'CIC', 'ECE', 'EEE', 'MECH', 'CIVIL'];

// ==========================================================================
// PUBLIC & LANDING ROUTES
// ==========================================================================

app.get('/', (req, res) => {
  res.render('landing', {
    user: req.session.user || null,
    branches: SUPPORTED_BRANCHES
  });
});

app.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/home');
  res.render('login', { error: null, success: null });
});

app.post('/login', async (req, res) => {
  const { userEmail, userPassword } = req.body;
  try {
    if (!userEmail || !userPassword) {
      return res.render('login', { error: 'Please provide both email and password.' });
    }

    const normalizedEmail = userEmail.toLowerCase().trim();
    const user = await User.findOne({ userEmail: normalizedEmail });
    if (!user) {
      return res.render('login', { error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(userPassword, user.userPassword);
    if (!isMatch) {
      return res.render('login', { error: 'Invalid email or password.' });
    }

    req.session.userId = user._id;
    req.session.user = user.toObject();

    res.redirect('/home');
  } catch (err) {
    console.error('Login Error:', err);
    res.render('login', { error: 'An unexpected server error occurred.' });
  }
});

app.get('/register', (req, res) => {
  if (req.session.userId) return res.redirect('/home');
  res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
  const { userName, userEmail, userPassword, confirmPassword, academicBranch } = req.body;
  try {
    if (!userName || !userEmail || !userPassword) {
      return res.render('register', { error: 'All fields are required.' });
    }

    if (confirmPassword && userPassword !== confirmPassword) {
      return res.render('register', { error: 'Passwords do not match.' });
    }

    if (userPassword.length < 6) {
      return res.render('register', { error: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = userEmail.toLowerCase().trim();
    const existing = await User.findOne({ userEmail: normalizedEmail });
    if (existing) {
      return res.render('register', { error: 'An account with that email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(userPassword, 10);
    const newUser = new User({
      userName: userName.trim().toUpperCase(),
      userEmail: normalizedEmail,
      userPassword: hashedPassword,
      academicBranch: academicBranch || 'CSE',
      academicYear: '1st Year',
      academicSemester: '1st sem',
      studentRole: 'student',
      onboardingCompleted: true
    });

    await newUser.save();

    // Welcome Notification
    await Notification.create({
      user: newUser._id,
      title: 'Welcome to StudyBuddy!',
      message: `Your account for ${newUser.academicBranch} has been created. Start exploring your syllabus!`,
      type: 'system'
    });

    res.render('login', {
      error: null,
      success: 'Registration successful! You can now sign in.'
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.render('register', { error: 'Server error during registration.' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.get('/forgot', (req, res) => {
  res.render('forgot', { error: null, message: null, devResetLink: null });
});

app.post('/forgot', async (req, res) => {
  const { userEmail } = req.body;
  try {
    if (!userEmail) {
      return res.render('forgot', { error: 'Please enter your email.', message: null, devResetLink: null });
    }

    const normalizedEmail = userEmail.toLowerCase().trim();
    const user = await User.findOne({ userEmail: normalizedEmail });
    if (!user) {
      return res.render('forgot', {
        error: 'No student account found with that email.',
        message: null,
        devResetLink: null
      });
    }

    // Cryptographically secure token
    const rawToken = crypto.randomBytes(24).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetToken = rawToken;
    user.resetTokenHash = tokenHash;
    user.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    const resetUrl = `http://localhost:${process.env.PORT || 7070}/reset/${rawToken}`;

    // Development Fallback or SMTP
    if (!process.env.EMAIL || !process.env.EMAIL_PASS) {
      console.log(`[DEV MODE] Password reset link for ${user.userEmail}: ${resetUrl}`);
      return res.render('forgot', {
        error: null,
        message: 'Password reset link generated successfully.',
        devResetLink: resetUrl
      });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"StudyBuddy" <${process.env.EMAIL}>`,
      to: user.userEmail,
      subject: 'StudyBuddy - Password Reset Request',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>StudyBuddy Password Reset</h2>
          <p>Hello ${user.userName},</p>
          <p>You requested a password reset. Click the button below to set a new password:</p>
          <p><a href="${resetUrl}" style="background:#4f46e5;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;">Reset Password</a></p>
          <p>Or copy this link: ${resetUrl}</p>
          <p>This link expires in 1 hour.</p>
        </div>
      `
    });

    res.render('forgot', {
      error: null,
      message: 'Reset instructions have been sent to your email.',
      devResetLink: null
    });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.render('forgot', { error: 'Server error sending reset instructions.', message: null, devResetLink: null });
  }
});

app.get('/reset/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      $or: [
        { resetToken: token, resetTokenExpiry: { $gt: Date.now() } },
        { resetTokenHash: tokenHash, resetTokenExpiry: { $gt: Date.now() } }
      ]
    });

    if (!user) {
      return res.render('reset', { token: null, error: 'Reset token is invalid or has expired.', success: null });
    }

    res.render('reset', { token, error: null, success: null });
  } catch (err) {
    res.render('reset', { token: null, error: 'Error validating reset token.', success: null });
  }
});

app.post('/reset/:token', async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  try {
    if (password !== confirmPassword) {
      return res.render('reset', { token, error: 'Passwords do not match.', success: null });
    }

    if (password.length < 6) {
      return res.render('reset', { token, error: 'Password must be at least 6 characters.', success: null });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      $or: [
        { resetToken: token, resetTokenExpiry: { $gt: Date.now() } },
        { resetTokenHash: tokenHash, resetTokenExpiry: { $gt: Date.now() } }
      ]
    });

    if (!user) {
      return res.render('reset', { token: null, error: 'Reset token is invalid or has expired.', success: null });
    }

    user.userPassword = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenHash = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.render('reset', { token: null, error: null, success: 'Password reset successful! You can now sign in.' });
  } catch (err) {
    res.render('reset', { token: null, error: 'Server error while resetting password.', success: null });
  }
});

// ==========================================================================
// STUDENT WORKSPACE ROUTES
// ==========================================================================

app.get('/home', requireAuth, async (req, res) => {
  try {
    const user = req.session.user;

    // Aggregate real metrics
    const savedCount = user.bookmarks ? user.bookmarks.length : 0;
    
    // Distinct subjects in user's branch
    const branch = user.academicBranch || 'CSE';
    const distinctSubjects = await List.distinct('subject', { branch });

    // Syllabus completion
    const completedTopics = await StudentProgress.countDocuments({
      user: user._id,
      status: 'completed'
    });
    const totalBranchTopics = await List.countDocuments({ branch });
    const completionPct = totalBranchTopics > 0 
      ? Math.min(100, Math.round((completedTopics / totalBranchTopics) * 100)) 
      : 0;

    // Focus session stats
    const sessions = await StudySession.find({ user: user._id });
    const focusMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    // Bookmarked resources populated
    const bookmarks = await List.find({ _id: { $in: user.bookmarks || [] } }).limit(6).lean();

    // Semester subjects breakdown
    const subjectDocs = await List.aggregate([
      { $match: { branch, semester: user.academicSemester || '1st sem' } },
      { $group: { _id: '$subject', count: { $sum: 1 } } }
    ]);
    const semesterSubjects = subjectDocs.map(s => ({ name: s._id, count: s.count }));

    // Recent tasks
    const recentTasks = await StudyTask.find({ user: user._id }).sort({ dueDate: 1 }).limit(5).lean();

    res.render('home', {
      user,
      stats: {
        savedCount,
        subjectsCount: distinctSubjects.length,
        completionPct,
        completedTopics,
        focusMinutes,
        sessionsCount: sessions.length
      },
      bookmarks,
      semesterSubjects,
      recentTasks
    });
  } catch (err) {
    console.error('Home Dashboard Error:', err);
    res.status(500).render('error', { user: req.session.user, error: err });
  }
});

app.get('/dashboard', requireAuth, (req, res) => {
  res.redirect('/home');
});

// Academic Resource Explorer
app.get('/resources', requireAuth, async (req, res) => {
  try {
    const { branch, year, semester, subject, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 12;
    const skip = (page - 1) * limit;

    const filter = { isPublic: true };
    if (branch) filter.branch = branch;
    if (year) filter.year = year;
    if (semester) filter.semester = semester;
    if (subject) filter.subject = subject;

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { topic: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
        { unit: { $regex: q, $options: 'i' } }
      ];
    }

    const [resources, totalCount] = await Promise.all([
      List.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      List.countDocuments(filter)
    ]);

    // Available subjects for current branch
    const subjectFilter = branch ? { branch } : {};
    const availableSubjects = await List.distinct('subject', subjectFilter);

    // Current query string builder for pagination links
    const queryParams = new URLSearchParams();
    if (branch) queryParams.set('branch', branch);
    if (year) queryParams.set('year', year);
    if (semester) queryParams.set('semester', semester);
    if (subject) queryParams.set('subject', subject);
    if (search) queryParams.set('search', search);

    const queryString = queryParams.toString() ? `&${queryParams.toString()}` : '';

    const userBookmarks = (req.session.user.bookmarks || []).map(b => b.toString());

    res.render('resources', {
      user: req.session.user,
      resources,
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
      currentPage: page,
      selectedBranch: branch || '',
      selectedYear: year || '',
      selectedSemester: semester || '',
      selectedSubject: subject || '',
      searchQuery: search || '',
      availableSubjects,
      currentQueryString: queryString,
      userBookmarks
    });
  } catch (err) {
    console.error('Resources Error:', err);
    res.status(500).render('error', { user: req.session.user, error: err });
  }
});

// Personal Library & Bookmarks
app.get('/library', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).lean();
    const bookmarks = await List.find({ _id: { $in: user.bookmarks || [] } }).sort({ updatedAt: -1 }).lean();

    res.render('library', {
      user,
      bookmarks
    });
  } catch (err) {
    console.error('Library Error:', err);
    res.status(500).render('error', { user: req.session.user, error: err });
  }
});

// My Subjects & Syllabus Tracker
app.get('/subjects', requireAuth, async (req, res) => {
  try {
    const user = req.session.user;
    const branch = user.academicBranch || 'CSE';
    const year = user.academicYear || '1st Year';
    const semester = user.academicSemester || '1st sem';

    // Find all resources for student's branch, year, semester
    const branchResources = await List.find({ branch, year, semester }).lean();

    // Fetch user topic completion status
    const progressRecords = await StudentProgress.find({ user: user._id, status: 'completed' }).lean();
    const completedSet = new Set(progressRecords.map(p => `${p.subject}:::${p.topic}`));

    // Group by Subject -> Units -> Topics
    const subjectMap = {};
    branchResources.forEach(item => {
      if (!subjectMap[item.subject]) {
        subjectMap[item.subject] = { units: {}, totalTopics: 0, completedTopics: 0 };
      }
      const unitKey = item.unit || '1st unit';
      if (!subjectMap[item.subject].units[unitKey]) {
        subjectMap[item.subject].units[unitKey] = [];
      }

      const isCompleted = completedSet.has(`${item.subject}:::${item.topic}`);
      subjectMap[item.subject].units[unitKey].push({
        topicName: item.topic,
        link: item.link,
        isCompleted
      });
      subjectMap[item.subject].totalTopics++;
      if (isCompleted) subjectMap[item.subject].completedTopics++;
    });

    const subjectsData = Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      totalTopics: data.totalTopics,
      completedTopics: data.completedTopics,
      units: Object.entries(data.units).map(([unitName, topics]) => ({
        unitName,
        topics
      }))
    }));

    const totalTopicsCount = subjectsData.reduce((acc, s) => acc + s.totalTopics, 0);
    const completedCount = subjectsData.reduce((acc, s) => acc + s.completedTopics, 0);
    const overallCompletion = totalTopicsCount > 0 ? Math.round((completedCount / totalTopicsCount) * 100) : 0;

    res.render('subjects', {
      user,
      subjectsData,
      overallCompletion,
      completedCount,
      totalTopicsCount
    });
  } catch (err) {
    console.error('Subjects Error:', err);
    res.status(500).render('error', { user: req.session.user, error: err });
  }
});

// Study Planner & Focus Timer
app.get('/planner', requireAuth, async (req, res) => {
  try {
    const user = req.session.user;
    const [tasks, sessions] = await Promise.all([
      StudyTask.find({ user: user._id }).sort({ dueDate: 1 }).lean(),
      StudySession.find({ user: user._id }).sort({ createdAt: -1 }).lean()
    ]);

    const totalFocusMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    res.render('planner', {
      user,
      tasks,
      totalFocusMinutes,
      totalSessionsCount: sessions.length
    });
  } catch (err) {
    console.error('Planner Error:', err);
    res.status(500).render('error', { user: req.session.user, error: err });
  }
});

// Model Papers
app.get('/model-papers', requireAuth, (req, res) => {
  res.render('modelpapers', { user: req.session.user });
});

// Notifications
app.get('/notifications', requireAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.session.userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.render('notifications', {
      user: req.session.user,
      notifications
    });
  } catch (err) {
    console.error('Notifications Error:', err);
    res.status(500).render('error', { user: req.session.user, error: err });
  }
});

// Profile & Settings
app.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).lean();
    res.render('profile', { user });
  } catch (err) {
    console.error('Profile Error:', err);
    res.status(500).render('error', { user: req.session.user, error: err });
  }
});

// Upload Notes Page
app.get('/upload', requireAuth, async (req, res) => {
  try {
    const userUploads = await Upload.find({ user: req.session.userId }).sort({ createdAt: -1 }).lean();
    res.render('upload', {
      user: req.session.user,
      upload: userUploads
    });
  } catch (err) {
    console.error('Upload Page Error:', err);
    res.status(500).render('error', { user: req.session.user, error: err });
  }
});

// ==========================================================================
// REST API ENDPOINTS
// ==========================================================================

// --- Bookmarks API ---
app.post('/api/bookmarks/:id', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const resourceId = req.params.id;

    const index = user.bookmarks.findIndex(b => b.toString() === resourceId);
    let bookmarked = false;

    if (index > -1) {
      user.bookmarks.splice(index, 1);
      user.favorites = user.bookmarks; // keep synchronized
      bookmarked = false;
    } else {
      user.bookmarks.push(resourceId);
      user.favorites = user.bookmarks;
      bookmarked = true;
    }

    await user.save();
    req.session.user.bookmarks = user.bookmarks;

    res.json({
      success: true,
      bookmarked,
      savedCount: user.bookmarks.length,
      message: bookmarked ? 'Saved to library' : 'Removed from library'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle bookmark' });
  }
});

app.delete('/api/bookmarks/:id', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    user.bookmarks = user.bookmarks.filter(b => b.toString() !== req.params.id);
    user.favorites = user.bookmarks;
    await user.save();
    req.session.user.bookmarks = user.bookmarks;
    res.json({ success: true, savedCount: user.bookmarks.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete bookmark' });
  }
});

// --- Student Syllabus Progress API ---
app.post('/api/progress', requireAuth, async (req, res) => {
  try {
    const { subject, unit, topic, status } = req.body;
    const user = req.session.user;

    await StudentProgress.findOneAndUpdate(
      { user: user._id, subject, topic },
      {
        user: user._id,
        branch: user.academicBranch || 'CSE',
        year: user.academicYear || '1st Year',
        semester: user.academicSemester || '1st sem',
        unit: unit || '1st unit',
        subject,
        topic,
        status: status || 'completed',
        completedAt: new Date()
      },
      { upsert: true, new: true }
    );

    const branch = user.academicBranch || 'CSE';
    const [totalTopics, completedCount] = await Promise.all([
      List.countDocuments({ branch }),
      StudentProgress.countDocuments({ user: user._id, status: 'completed' })
    ]);

    const overallCompletion = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

    res.json({
      success: true,
      overallCompletion,
      completedCount
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update topic progress' });
  }
});

// --- Tasks Planner API ---
app.post('/api/tasks', requireAuth, async (req, res) => {
  try {
    const { title, description, subject, priority, dueDate } = req.body;
    const task = new StudyTask({
      user: req.session.userId,
      title: title.trim(),
      description: description ? description.trim() : '',
      subject: subject || 'General',
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null
    });
    await task.save();
    res.status(201).json({ success: true, task });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    const task = await StudyTask.findOneAndUpdate(
      { _id: req.params.id, user: req.session.userId },
      { $set: req.body },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    const result = await StudyTask.deleteOne({ _id: req.params.id, user: req.session.userId });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// --- Study Sessions API ---
app.post('/api/study-sessions', requireAuth, async (req, res) => {
  try {
    const { durationMinutes, sessionType, subject, topic } = req.body;
    const session = new StudySession({
      user: req.session.userId,
      durationMinutes: durationMinutes || 25,
      sessionType: sessionType || 'pomodoro',
      subject: subject || 'General',
      topic: topic || '',
      completed: true
    });
    await session.save();
    res.status(201).json({ success: true, session });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log study session' });
  }
});

// --- Notifications API ---
app.patch('/api/notifications/:id/read', requireAuth, async (req, res) => {
  try {
    await Notification.updateOne({ _id: req.params.id, user: req.session.userId }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

app.patch('/api/notifications/read-all', requireAuth, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.session.userId, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// --- User Profile & Onboarding API ---
app.post('/api/user/onboarding', requireAuth, async (req, res) => {
  try {
    const { academicBranch, academicYear, academicSemester, favoriteSubjects } = req.body;
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (academicBranch) user.academicBranch = academicBranch;
    if (academicYear) user.academicYear = academicYear;
    if (academicSemester) user.academicSemester = academicSemester;
    if (Array.isArray(favoriteSubjects)) user.favoriteSubjects = favoriteSubjects;
    user.onboardingCompleted = true;

    await user.save();
    req.session.user = user.toObject();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save onboarding settings' });
  }
});

app.post('/api/user/profile', requireAuth, async (req, res) => {
  try {
    const { userName, academicBranch, academicYear, academicSemester } = req.body;
    const user = await User.findById(req.session.userId);

    if (userName) user.userName = userName.trim().toUpperCase();
    if (academicBranch) user.academicBranch = academicBranch;
    if (academicYear) user.academicYear = academicYear;
    if (academicSemester) user.academicSemester = academicSemester;

    await user.save();
    req.session.user = user.toObject();

    res.redirect('/profile');
  } catch (err) {
    res.status(500).render('error', { user: req.session.user, error: 'Failed to update profile' });
  }
});

app.post('/api/user/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.session.userId);

    const isMatch = await bcrypt.compare(currentPassword, user.userPassword);
    if (!isMatch) {
      return res.status(400).render('error', { user: req.session.user, error: 'Current password is incorrect.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).render('error', { user: req.session.user, error: 'New password must be at least 6 characters.' });
    }

    user.userPassword = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.redirect('/profile');
  } catch (err) {
    res.status(500).render('error', { user: req.session.user, error: 'Failed to change password' });
  }
});

// --- Uploads API ---
app.post('/upload/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.body.title) {
      return res.status(400).json({ success: false, error: 'File and Title are required.' });
    }

    const mime = req.file.mimetype;
    let fileType = 'other';
    if (mime.includes('pdf')) fileType = 'pdf';
    else if (mime.includes('image')) fileType = 'image';
    else if (mime.includes('text')) fileType = 'text';

    const newUpload = new Upload({
      title: req.body.title.trim(),
      description: req.body.description ? req.body.description.trim() : '',
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileType,
      subject: req.body.subject || 'General',
      branch: req.body.branch || req.session.user.academicBranch || 'CSE',
      year: req.body.year || req.session.user.academicYear || '1st Year',
      semester: req.body.semester || req.session.user.academicSemester || '1st sem',
      unit: req.body.unit || '1st unit',
      user: req.session.userId
    });

    await newUpload.save();

    res.status(201).json({ success: true, data: newUpload });
  } catch (err) {
    console.error('File Upload Error:', err);
    res.status(500).json({ success: false, error: err.message || 'Upload failed' });
  }
});

app.delete('/upload/:id', requireAuth, async (req, res) => {
  try {
    const doc = await Upload.findOne({ _id: req.params.id, user: req.session.userId });
    if (!doc) return res.status(404).json({ error: 'Upload not found' });

    if (doc.filename) {
      const fullPath = path.join(uploadDir, doc.filename);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }

    await Upload.deleteOne({ _id: doc._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// ==========================================================================
// ADMINISTRATIVE PORTAL ROUTES & APIS
// ==========================================================================

app.get('/admin', requireAdmin, async (req, res) => {
  try {
    const [totalResources, totalUsers, distinctSubjects, branchCounts, recentResources] = await Promise.all([
      List.countDocuments(),
      User.countDocuments(),
      List.distinct('subject').then(s => s.length),
      List.aggregate([
        { $group: { _id: '$branch', count: { $sum: 1 } } }
      ]),
      List.find().sort({ createdAt: -1 }).limit(10).lean()
    ]);

    const branchBreakdown = {};
    branchCounts.forEach(b => {
      branchBreakdown[b._id] = b.count;
    });

    res.render('admin', {
      user: req.session.user,
      adminStats: {
        totalResources,
        totalUsers,
        distinctSubjects,
        branchBreakdown
      },
      recentResources
    });
  } catch (err) {
    console.error('Admin Dashboard Error:', err);
    res.status(500).render('error', { user: req.session.user, error: err });
  }
});

app.post('/api/admin/resources', requireAdmin, async (req, res) => {
  try {
    const { topic, branch, year, semester, subject, unit, link, type } = req.body;
    if (!topic || !branch || !subject || !link) {
      return res.status(400).json({ error: 'Topic, Branch, Subject, and Link are required.' });
    }

    const newRes = new List({
      topic: topic.trim(),
      branch: branch.trim().toUpperCase(),
      year: year || '1st Year',
      semester: semester || '1st sem',
      subject: subject.trim().toUpperCase(),
      unit: unit ? unit.trim() : '1st unit',
      link: link.trim(),
      type: type || 'drive',
      isPublic: true,
      addedBy: req.session.userId
    });

    await newRes.save();
    res.status(201).json({ success: true, resource: newRes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save resource' });
  }
});

app.delete('/api/admin/resources/:id', requireAdmin, async (req, res) => {
  try {
    await List.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

app.post('/api/admin/resources/import', requireAdmin, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid data format. Expected an array of records.' });
    }

    const formatted = items.map(item => ({
      branch: (item.branch || 'CSE').trim().toUpperCase(),
      year: (item.year || '1st Year').trim(),
      semester: (item.semester || '1st sem').trim(),
      subject: (item.subject || 'General').trim().toUpperCase(),
      unit: (item.unit || '1st unit').trim(),
      topic: (item.topic || `${item.subject} Note`).trim(),
      link: (item.link || '#').trim(),
      type: item.link && item.link.includes('drive.google.com') ? 'drive' : (item.link && item.link.endsWith('.pdf') ? 'pdf' : 'link'),
      isPublic: true,
      addedBy: req.session.userId
    }));

    await List.insertMany(formatted);
    res.json({ success: true, importedCount: formatted.length });
  } catch (err) {
    console.error('Import Error:', err);
    res.status(500).json({ error: 'Failed to import records: ' + err.message });
  }
});

// ==========================================================================
// ERROR & 404 HANDLERS
// ==========================================================================

app.use((req, res) => {
  res.status(404).render('404', {
    user: req.session.user || null,
    message: 'The requested academic page does not exist.'
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).render('error', {
    user: req.session ? req.session.user : null,
    error: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected server error occurred.'
  });
});

// Server Initialization
const PORT = process.env.PORT || 7070;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 StudyBuddy Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;