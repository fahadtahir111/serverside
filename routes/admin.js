const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
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

// CRUD: Get all users
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, username: true, email: true, credits: true, created_at: true } });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// CRUD: Get one user
router.get('/users/:id', adminMiddleware, async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) return res.status(400).json({ message: 'Invalid user id' });
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// CRUD: Create user
router.post('/users', adminMiddleware, async (req, res) => {
  const { username, email, password, credits } = req.body;
  if (!username || !email || !password) return res.status(400).json({ message: 'All fields required' });
  try {
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, password_hash: hash, credits: credits || 0 }
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// CRUD: Update user
router.patch('/users/:id', adminMiddleware, async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) return res.status(400).json({ message: 'Invalid user id' });
  const { username, email, credits } = req.body;
  if (!username && !email && credits === undefined) return res.status(400).json({ message: 'No fields to update' });
  try {
    const data = {};
    if (username) data.username = username;
    if (email) data.email = email;
    if (credits !== undefined) data.credits = Number(credits);
    const user = await prisma.user.update({ where: { id: userId }, data });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// CRUD: Delete user
router.delete('/users/:id', adminMiddleware, async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) return res.status(400).json({ message: 'Invalid user id' });
  try {
    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// List all purchases
router.get('/purchases', adminMiddleware, async (req, res) => {
  try {
    const purchases = await prisma.purchase.findMany({ orderBy: { timestamp: 'desc' } });
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get total revenue
router.get('/revenue', adminMiddleware, async (req, res) => {
  try {
    const result = await prisma.purchase.aggregate({ _sum: { amount: true } });
    res.json({ totalRevenue: result._sum.amount || 0 });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get user payment and credit history
router.get('/users/:id/history', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const purchases = await prisma.purchase.findMany({ where: { user_id: id }, orderBy: { timestamp: 'desc' } });
    // If you have a credit usage table, fetch it here as well
    res.json({ purchases });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Logs: Get all logs for admin dashboard
router.get('/logs', adminMiddleware, async (req, res) => {
  try {
    const logs = await prisma.log.findMany({
      orderBy: { timestamp: 'desc' },
      select: { id: true, timestamp: true, user_id: true, action: true, details: true }
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 