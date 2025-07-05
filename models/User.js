const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, maxlength: 50 },
  email: { type: String, required: true, unique: true, maxlength: 100 },
  password_hash: { type: String, required: true },
  credits: { type: Number, default: 3 },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema); 