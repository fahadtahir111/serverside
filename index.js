const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const creditsRoutes = require('./routes/credits');
const adminRoutes = require('./routes/admin');
const path = require('path');
const { logEvent } = require('./log');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/admin', adminRoutes);

app.get('/admin', async (req, res) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, username: true, email: true, credits: true } });
    const purchases = await prisma.purchase.findMany({ orderBy: { timestamp: 'desc' } });
    const logs = await prisma.log.findMany({ orderBy: { timestamp: 'desc' }, take: 100 });
    res.render('admin', { users, purchases, logs });
  } catch (err) {
    res.status(500).send('Server error: ' + err.message);
  }
});

app.get('/admin/users-table', async (req, res) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, username: true, email: true, credits: true } });
    res.render('users-table', { users }, (err, html) => {
      if (err) return res.status(500).send('Server error: ' + err.message);
      res.send(html);
    });
  } catch (err) {
    res.status(500).send('Server error: ' + err.message);
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 