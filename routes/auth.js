const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { logEvent } = require('../log');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

console.log('Auth routes loaded');

// Signup
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  console.log('Signup attempt:', { username, email });
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (username, email, password_hash, credits) VALUES (?, ?, ?, 3)', [username, email, hash]);
    // Log signup event
    const [newUser] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    await logEvent({ user_id: newUser[0].id, action: 'signup', details: { email } });
    res.status(201).json({ message: 'User registered, 3 free credits granted' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', { email });
  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    // Log login event
    await logEvent({ user_id: user.id, action: 'login', details: { email } });
    res.json({ token, username: user.username, credits: user.credits });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 