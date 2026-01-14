const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/user');
const { isGuest } = require('../middleware/auth');

const SALT_ROUNDS = 10;

// GET /auth/sign-up
router.get('/sign-up', isGuest, (req, res) => {
  res.render('auth/sign-up', { error: null });
});

// POST /auth/sign-up
router.post('/sign-up', isGuest, async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.render('auth/sign-up', { error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.render('auth/sign-up', { error: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.render('auth/sign-up', { error: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    req.session.user = {
      _id: user._id,
      username: user.username,
      email: user.email,
    };

    res.redirect('/tasks');
  } catch (error) {
    console.error(error);
    res.render('auth/sign-up', { error: 'An error occurred. Please try again.' });
  }
});

// GET /auth/sign-in
router.get('/sign-in', isGuest, (req, res) => {
  res.render('auth/sign-in', { error: null });
});

// POST /auth/sign-in
router.post('/sign-in', isGuest, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.render('auth/sign-in', { error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render('auth/sign-in', { error: 'Invalid email or password' });
    }

    req.session.user = {
      _id: user._id,
      username: user.username,
      email: user.email,
    };

    res.redirect('/tasks');
  } catch (error) {
    console.error(error);
    res.render('auth/sign-in', { error: 'An error occurred. Please try again.' });
  }
});

// GET /auth/sign-out
router.get('/sign-out', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;