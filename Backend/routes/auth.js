const bcrypt = require('bcryptjs');
const { createHash } = require('node:crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hasNumber = /\d/;
const hasSymbol = /[^A-Za-z0-9\s]/;
const hashPasswordInput = (password) =>
  createHash('sha256').update(password, 'utf8').digest('hex');

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: 'Member',
});

const createToken = (user) =>
  jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body ?? {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) {
    return res.status(400).json({ error: 'Name is required and must be 80 characters or fewer.' });
  }
  if (normalizedEmail.length > 254 || !emailPattern.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  if (
    typeof password !== 'string' ||
    password.length < 6 ||
    !hasNumber.test(password) ||
    !hasSymbol.test(password)
  ) {
    return res.status(400).json({
      error: 'Password must be at least 6 characters and include a number and a symbol.',
    });
  }

  try {
    const passwordHash = await bcrypt.hash(hashPasswordInput(password), 12);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });
    return res.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    console.error('Signup failed:', error.message);
    return res.status(500).json({ error: 'Could not create the account.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!emailPattern.test(normalizedEmail) || typeof password !== 'string') {
    return res.status(400).json({ error: 'Enter a valid email address and password.' });
  }

  try {
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(hashPasswordInput(password), user.passwordHash))) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    return res.json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    console.error('Login failed:', error.message);
    return res.status(500).json({ error: 'Could not sign in.' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  return res.json({
    user: {
      id: req.user.userId,
      name: req.user.name,
      email: req.user.email,
      role: 'Member',
    },
  });
});

module.exports = router;
