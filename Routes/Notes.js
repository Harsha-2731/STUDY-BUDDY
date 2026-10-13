const express = require('express');
const routes = express.Router();
const List = require('../MODELS/List');

function isLogged(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.render('login'); // 🔧 fixed render path
  }
}

// GET upload page
routes.get('/upload', isLogged, (req, res) => {
  res.render('upload'); // ✅ Page to upload notes
});

// POST upload data
routes.post('/upload', isLogged, async (req, res) => {
  try {
    const { subject, branch, year, topic, link } = req.body;

    const newNote = new List({
      subject,
      branch,
      year,
      topic,
      link,
      addedBy: req.session.user._id,
    });

    await newNote.save();
    res.redirect('/dashboard'); // ✅ Send back to dashboard
  } catch (err) {
    console.error(err);
    res.status(500).send('error');
  }
});

module.exports = routes;
