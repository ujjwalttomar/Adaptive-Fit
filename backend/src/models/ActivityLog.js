const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: {
    type: String,
    enum: ['login', 'logout', 'meal_logged', 'workout_started', 'workout_completed', 'workout_skipped', 'chatbot_message', 'profile_viewed', 'progress_viewed'],
    required: true
  },
  eventDetails: {
    sessionDuration: Number,
    workoutId: mongoose.Schema.Types.ObjectId,
    mealId: mongoose.Schema.Types.ObjectId
  },
  recordedAt: { type: Date, default: Date.now },
  recordedDate: { type: String }
});

activityLogSchema.pre('save', function(next) {
  if (!this.recordedDate) {
    const d = new Date();
    this.recordedDate = d.toISOString().split('T')[0];
  }
  next();
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
