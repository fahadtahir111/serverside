const Log = require('./models/Log');

async function logEvent({ user_id = null, action, details = null }) {
  await Log.create({
    user_id,
    action,
    details,
  });
}

module.exports = { logEvent }; 