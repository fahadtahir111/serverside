const express = require('express');
const pool = require('../db');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Simple admin middleware (replace with robust logic in production)
function adminMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // For demo: treat user with email 'admin@admin.com' as admin
    if (decoded.email !== 'admin@admin.com') {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// List all users
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, username, email, credits FROM users');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update user credits
router.post('/users/:id/credits', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { credits } = req.body;
  if (typeof credits !== 'number' || credits < 0) {
    return res.status(400).json({ message: 'Invalid credits value' });
  }
  try {
    await pool.query('UPDATE users SET credits = ? WHERE id = ?', [credits, id]);
    res.json({ message: 'Credits updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all purchases (for revenue graph)
router.get('/purchases', adminMiddleware, async (req, res) => {
  try {
    const [purchases] = await pool.query('SELECT * FROM purchases ORDER BY timestamp DESC');
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get revenue summary
router.get('/revenue', adminMiddleware, async (req, res) => {
  try {
    const [result] = await pool.query('SELECT SUM(amount) as totalRevenue FROM purchases');
    res.json({ totalRevenue: result[0].totalRevenue || 0 });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Edit user details (username, email, credits) - NO adminMiddleware for server-rendered dashboard
router.patch('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, email, credits } = req.body;
  if (!username && !email && credits === undefined) {
    return res.status(400).json({ message: 'No fields to update' });
  }
  try {
    const fields = [];
    const values = [];
    if (username) {
      fields.push('username = ?');
      values.push(username);
    }
    if (email) {
      fields.push('email = ?');
      values.push(email);
    }
    if (credits !== undefined) {
      fields.push('credits = ?');
      values.push(Number(credits));
    }
    values.push(id);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete user - NO adminMiddleware for server-rendered dashboard
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get user payment and credit history
router.get('/users/:id/history', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [purchases] = await pool.query('SELECT * FROM purchases WHERE user_id = ? ORDER BY timestamp DESC', [id]);
    // If you have a credit usage table, fetch it here as well
    res.json({ purchases });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 