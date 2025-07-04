const pool = require('./db');

async function logEvent({ user_id = null, action, details = null }) {
  await pool.query(
    'INSERT INTO logs (user_id, action, details) VALUES (?, ?, ?)',
    [user_id, action, details ? JSON.stringify(details) : null]
  );
}

module.exports = { logEvent }; 