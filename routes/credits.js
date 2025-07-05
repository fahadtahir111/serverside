const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('./authMiddleware');

const prisma = new PrismaClient();
const router = express.Router();

// Get user credits
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ credits: user.credits });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Use a credit (atomic, optimized)
router.post('/use-credit', authMiddleware, async (req, res) => {
  try {
    // Atomically decrement credits if credits > 0 and return new value
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { credits: { decrement: 1 } },
    });
    if (user.credits < 0) {
      // Rollback if credits went negative (shouldn't happen with atomic op)
      await prisma.user.update({ where: { id: req.user.id }, data: { credits: 0 } });
      return res.status(400).json({ message: 'No credits left' });
    }
    // Log analyze/credit usage event
    await prisma.log.create({
      data: { user_id: user.id, action: 'analyze', details: { credits_left: user.credits } }
    });
    res.json({ message: 'Credit used', credits: user.credits });
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
    await prisma.user.update({
      where: { id: req.user.id },
      data: { credits: { increment: credits } },
    });
    // Record purchase
    await prisma.purchase.create({
      data: { user_id: req.user.id, amount, credits }
    });
    res.json({ message: 'Credits purchased successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 