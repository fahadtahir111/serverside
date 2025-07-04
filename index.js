const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const creditsRoutes = require('./routes/credits');
const adminRoutes = require('./routes/admin');
const path = require('path');
const { logEvent } = require('./log');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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
    const [users] = await require('./db').query('SELECT id, username, email, credits FROM users');
    const [purchases] = await require('./db').query('SELECT * FROM purchases ORDER BY timestamp DESC');
    const [logs] = await require('./db').query('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100');
    res.render('admin', { users, purchases, logs });
  } catch (err) {
    res.status(500).send('Server error: ' + err.message);
  }
});

app.get('/admin/users-table', async (req, res) => {
  try {
    const [users] = await require('./db').query('SELECT id, username, email, credits FROM users');
    res.render('users-table', { users }, (err, html) => {
      if (err) return res.status(500).send('Server error: ' + err.message);
      res.send(html);
    });
  } catch (err) {
    res.status(500).send('Server error: ' + err.message);
  }
});

app.patch('/admin/users/:id', async (req, res) => {
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
    await require('./db').query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    console.log('PATCH response:', res);
    return res.status(200).json({ message: 'User updated' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 