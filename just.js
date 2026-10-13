// const express = require('express');
// const path = require('path');
// const mongoose = require('mongoose');
// const bodyParser = require('body-parser');
// const dotenv = require('dotenv');
// const session = require('express-session');
// const MongoStore = require('connect-mongo');
// const bcrypt = require('bcryptjs');
// const crypto = require('crypto');
// const nodemailer = require('nodemailer');
// const User = require('./MODELS/User');
// const List = require('./MODELS/List');
// const Resource = require('./MODELS/Resource'); 
// const Upload = require('./MODELS/Upload')
// dotenv.config();

// const app = express();
// app.set('view engine', 'ejs');
// app.use(express.static('public'));
// app.use(bodyParser.urlencoded({ extended: false }));

// // MongoDB Connection
// mongoose
//   .connect(process.env.MONGO_URL)
//   .then(() => console.log('✅ MongoDB Connected'))
//   .catch((err) => console.error(err));

// // Session Setup
// app.use(
//   session({
//     secret: 'secretkey',
//     resave: false,
//     saveUninitialized: false,
//     store: MongoStore.create({ mongoUrl: process.env.MONGO_URL }),
//     cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
//   })
// );

// // Add formatDate helper to all templates
// app.locals.formatDate = (date) => {
//   if (!date) return 'No date';
//   return new Date(date).toLocaleDateString('en-US', {
//     year: 'numeric',
//     month: 'short',
//     day: 'numeric'
//   });
// };

// // Splash Screen
// app.get('/', (req, res) => {
//   res.render('splash');
// });

// // ======================== AUTH ROUTES ========================

// app.get('/login', (req, res) => {
//   res.render('login', { error: null });
// });

// app.post('/login', async (req, res) => {
//   const { userEmail, userPassword } = req.body;
//   try {
//     const user = await User.findOne({ userEmail: userEmail.toLowerCase().trim() });
//     if (!user) return res.render('login', { error: 'Invalid email or password' });

//     const isMatch = await bcrypt.compare(userPassword, user.userPassword);
//     if (!isMatch) return res.render('login', { error: 'Invalid email or password' });

//     req.session.userId = user._id;
//     req.session.user = {
//       _id: user._id, // ✅ include ID
//       userName: user.userName,
//       userEmail: user.userEmail
//     };

//     res.redirect('/home');
//   } catch (err) {
//     console.error('Login Error:', err);
//     res.render('login', { error: 'Server error' });
//   }
// });

// app.get('/register', (req, res) => {
//   res.render('register', { error: null });
// });

// app.post('/register', async (req, res) => {
//   const { userName, userEmail, userPassword } = req.body;
//   try {
//     const existingUser = await User.findOne({ userEmail });
//     if (existingUser) return res.render('register', { error: 'Email already exists' });

//     const hashedPassword = await bcrypt.hash(userPassword, 10);
//     const user = new User({ userName, userEmail, userPassword: hashedPassword });
//     await user.save();

//     res.redirect('/login');
//   } catch (err) {
//     console.error('Register Error:', err);
//     res.render('register', { error: 'Server error' });
//   }
// });

// // Forgot Password - GET
// app.get('/forgot', (req, res) => {
//   res.render('forgot', { error: null, message: null });
// });

// // Forgot Password - POST
// app.post('/forgot', async (req, res) => {
//   const { userEmail } = req.body;
//   try {
//     const user = await User.findOne({ userEmail });
//     if (!user) return res.render('forgot', { error: 'No user with that email found', message: null });

//     const token = crypto.randomBytes(20).toString('hex');
//     user.resetToken = token;
//     user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
//     await user.save();

//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: process.env.EMAIL,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     const mailOptions = {
//       to: user.userEmail,
//       from: process.env.EMAIL,
//       subject: 'StudyBuddy - Password Reset',
//       html: `<p>You requested a password reset</p><p>Click <a href="http://localhost:${process.env.PORT || 7070}/reset/${token}">here</a> to reset your password</p>`
//     };

//     transporter.sendMail(mailOptions, (err) => {
//       if (err) {
//         console.error('Mail Error:', err);
//         return res.render('forgot', { error: 'Error sending email', message: null });
//       }
//       res.render('forgot', {
//         error: null,
//         message: 'Check your email for the reset link'
//       });
//     });
//   } catch (err) {
//     console.error('Forgot Error:', err);
//     res.render('forgot', { error: 'Server error', message: null });
//   }
// });

// // Reset Password Routes
// app.get("/reset/:token", async (req, res) => {
//   const token = req.params.token;
//   const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
//   if (!user) return res.render("reset", { token: null, error: "Token expired or invalid", success: null });
//   res.render("reset", { token, error: null, success: null });
// });

// app.post("/reset/:token", async (req, res) => {
//   const { token } = req.params;
//   const { password, confirmPassword } = req.body;

//   const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
//   if (!user) return res.render("reset", { token: null, error: "Token expired or invalid", success: null });
//   if (password !== confirmPassword) return res.render("reset", { token, error: "Passwords do not match", success: null });

//   const hashedPassword = await bcrypt.hash(password, 10);
//   user.userPassword = hashedPassword;
//   user.resetToken = undefined;
//   user.resetTokenExpiry = undefined;
//   await user.save();

//   res.render("reset", { token: null, error: null, success: "Password reset successful! You can now login." });
// });

// // ======================== MAIN PAGES ========================

// app.get('/home', async (req, res) => {
//   try {
//     if (!req.session.userId) return res.redirect('/login');
    
//     const user = await User.findById(req.session.userId);
//     if (!user) {
//       req.session.destroy();
//       return res.redirect('/login');
//     }

//     // Get stats for dashboard
//     const subjectsCount = await List.distinct('subject', { addedBy: req.session.userId })
//                                   .then(subjects => subjects.length);
//     const notesCount = await List.countDocuments({ addedBy: req.session.userId });

//     res.render('home', {
//       user: req.session.user,
//       stats: {
//         subjects: subjectsCount,
//         notes: notesCount
//       }
//     });
//   } catch (err) {
//     console.error('Home error:', err);
//     res.status(500).render('home', {
//       user: req.session.user,
//       stats: {
//         subjects: 0,
//         notes: 0
//       },
//       error: 'Failed to load dashboard data'
//     });
//   }
// });

// app.get('/dashboard', async (req, res) => {
//   try {
//     if (!req.session.userId) return res.redirect('/login');
    
//     const user = await User.findById(req.session.userId);
//     if (!user) {
//       req.session.destroy();
//       return res.redirect('/login');
//     }

//     // Get stats for the logged-in user only
//     const subjectsCount = await List.distinct('subject', { addedBy: req.session.userId }).then(subjects => subjects.length);
//     const notesCount = await List.countDocuments({ addedBy: req.session.userId });

//     res.render('dashboard', {
//       user: req.session.user,
//       stats: {
//         subjects: subjectsCount,
//         notes: notesCount
//       }
//     });
//   } catch (err) {
//     console.error('Dashboard error:', err);
//     res.status(500).render('dashboard', {
//       user: req.session.user,
//       stats: {
//         subjects: 0,
//         notes: 0
//       },
//       error: 'Failed to load dashboard data'
//     });
//   }
// });

// app.get('/subjects', async (req, res) => {
//   try {
//     if (!req.session.userId) return res.redirect('/login');
    
//     const user = await User.findById(req.session.userId);
//     if (!user) {
//       req.session.destroy();
//       return res.redirect('/login');
//     }

//     res.render('subjects', {
//       user: req.session.user,
//       // You might want to add subjects data here if needed
//     });
//   } catch (err) {
//     console.error('Subjects page error:', err);
//     res.status(500).send('Internal Server Error');
//   }
// });

// app.get('/notes', async (req, res) => {
//   try {
//     if (!req.session.userId) return res.redirect('/login');
    
//     const user = await User.findById(req.session.userId);
//     if (!user) {
//       req.session.destroy();
//       return res.redirect('/login');
//     }

//     const userNotes = await List.find({ addedBy: req.session.userId })
//                               .sort({ createdAt: -1 });

//     res.render('notes', {
//       user: req.session.user,
//       notes: userNotes
//     });
//   } catch (err) {
//     console.error('Notes page error:', err);
//     res.status(500).send('Internal Server Error');
//   }
// });

// app.get('/upload', async (req, res) => {
//   try {
//     if (!req.session.userId) return res.redirect('/login');
    
//     const user = await User.findById(req.session.userId);
//     if (!user) {
//       req.session.destroy();
//       return res.redirect('/login');
//     }

//     // Get distinct subjects for dropdown
//     const subjects = await List.distinct('subject', { addedBy: req.session.userId });

//     res.render('upload', {
//       user: req.session.user,
//       subjects: subjects
//     });
//   } catch (err) {
//     console.error('Upload page error:', err);
//     res.status(500).send('Internal Server Error');
//   }
// });

// app.post('/upload', async (req, res) => {
//   try {
//     if (!req.session.userId) return res.redirect('/login');
    
//     const { title, subject, content } = req.body;
//     const newNote = new List({
//       title,
//       subject,
//       content,
//       addedBy: req.session.userId
//     });

//     await newNote.save();
//     res.redirect('/notes');
//   } catch (err) {
//     console.error('Upload error:', err);
//     res.status(500).send('Internal Server Error');
//   }
// });



// app.get('/logout', (req, res) => {
//   if (req.session) {
//     req.session.destroy((err) => {
//       if (err) {
//         console.error('Logout Error:', err);
//         return res.status(500).send('Error logging out.');
//       }
//       res.clearCookie('connect.sid'); // Clears the session cookie
//       res.redirect('/login');
//     });
//   } else {
//     res.redirect('/login');
//   }
// });


// // ======================== RESOURCES ROUTES ========================

// app.get('/resources', async (req, res) => {
//   try {
//     if (!req.session.userId) return res.redirect('/login');

//     const user = await User.findById(req.session.userId);
//     if (!user) {
//       req.session.destroy();
//       return res.redirect('/login');
//     }

//     res.render('resources', {
//       user,
//       branches: ['CSE', 'AIML', 'CIC', 'ECE','AIDS','CIVIL','MECH','IT','CSIT','CSD','EEE'],
//       years: ['1', '2', '3', '4'],
//       semesters: ['1', '2']
//     });
    
//   } catch (err) {
//     console.error('Resources error:', err);
//     res.status(500).render('error', {
//       user: req.session.user || null,
//       message: 'Failed to load resources'
//     });
//   }
// });

// app.get('/api/resources', async (req, res) => {
//   try {
//     if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });

//     const { branch, year, semester, subject, search } = req.query;
    
//     const filter = { 
//       $or: [
//         { isPublic: true },
//         { addedBy: req.session.userId }
//       ]
//     };

//     if (branch) filter.branch = branch;
//     if (year) filter.year = year;
//     if (semester) filter.semester = semester;
//     if (subject) filter.subject = subject;
//     if (search) {
//       filter.$or = [
//         ...filter.$or,
//         { topic: { $regex: search, $options: 'i' } },
//         { subject: { $regex: search, $options: 'i' } }
//       ];
//     }

//     const resources = await Resource.find(filter)
//       .populate('addedBy', 'userName')
//       .sort({ createdAt: -1 });

//     res.json(resources);
//   } catch (err) {
//     console.error('API Resources error:', err);
//     res.status(500).json({ error: 'Failed to fetch resources' });
//   }
// });

// app.post('/api/resources', async (req, res) => {
//   try {
//     if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });

//     const { topic, branch, year, semester, subject, link, type, isPublic } = req.body;
    
//     const newResource = new Resource({
//       topic,
//       branch,
//       year,
//       semester,
//       subject,
//       link,
//       type,
//       isPublic: isPublic || false,
//       addedBy: req.session.userId
//     });

//     await newResource.save();
//     res.status(201).json(newResource);
//   } catch (err) {
//     console.error('Create Resource error:', err);
//     res.status(500).json({ error: 'Failed to create resource' });
//   }
// });

// // ... (keep all your existing code after the resources route)


// // ERROR HANDLER MIDDLEWARE — always place at the end
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).render('error', {
//     user: req.session.user || null,
//     error: err // send actual error object
//   });
// });



// // 404 handler
// app.use((req, res) => {
//   res.status(404).render('404', {
//     user: req.session.user || null,
//     message: 'Page not found'
//   });
// });



// const PORT = process.env.PORT || 7070;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
// });
