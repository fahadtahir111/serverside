const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { logEvent } = require('../log');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
    
  }
}

// Get credits
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT credits FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ credits: users[0].credits });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Use a credit (atomic, optimized)
router.post('/use-credit', authMiddleware, async (req, res) => {
  try {
    // Atomically decrement credits if credits > 0 and return new value
    const [updateResult] = await pool.query(
      'UPDATE users SET credits = credits - 1 WHERE id = ? AND credits > 0',
      [req.user.id]
    );
    if (updateResult.affectedRows === 0) {
      return res.status(400).json({ message: 'No credits left' });
    }
    // Get updated credits in a single query
    const [users] = await pool.query('SELECT credits FROM users WHERE id = ?', [req.user.id]);
    // Log analyze/credit usage event
    await logEvent({ user_id: req.user.id, action: 'analyze', details: { credits_left: users[0].credits } });
    res.json({ message: 'Credit used', credits: users[0].credits });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Buy credits (add credits and record purchase)
router.post('/buy', authMiddleware, async (req, res) => {
  const { credits, amount } = req.body;
  if (!credits || !amount || credits <= 0 || amount <= 0) {
    return res.status(400).json({ message: 'Invalid credits or amount' });
  }
  try {
    // Add credits to user
    await pool.query('UPDATE users SET credits = credits + ? WHERE id = ?', [credits, req.user.id]);
    // Record purchase
    await pool.query('INSERT INTO purchases (user_id, amount, credits) VALUES (?, ?, ?)', [req.user.id, amount, credits]);
    res.json({ message: 'Credits purchased successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 