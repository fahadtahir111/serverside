const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cryptobot';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});
db.once('open', () => {
  console.log('Connected to MongoDB');
});

module.exports = mongoose; 