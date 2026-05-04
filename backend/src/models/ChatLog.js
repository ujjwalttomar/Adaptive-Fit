const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'bot'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  intent: String
});

const chatLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true },
  messages: [messageSchema],
  sessionStartedAt: { type: Date, default: Date.now },
  sessionEndedAt: Date
});

module.exports = mongoose.model('ChatLog', chatLogSchema);
