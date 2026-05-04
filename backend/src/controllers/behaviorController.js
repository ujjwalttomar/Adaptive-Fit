const ActivityLog = require('../models/ActivityLog');
const MealLog = require('../models/MealLog');
const WorkoutPlan = require('../models/WorkoutPlan');

function getTodayDate() { return new Date().toISOString().split('T')[0]; }

function normalize(value, min, max) {
  if (max === min) return 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

async function computeEngagementScore(userId) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysStr = sevenDaysAgo.toISOString().split('T')[0];

  const recentActivity = await ActivityLog.find({ userId, recordedDate: { $gte: sevenDaysStr } });

  // Login frequency
  const loginDates = new Set(recentActivity.filter(a => a.event === 'login').map(a => a.recordedDate));
  const loginFrequency = loginDates.size;

  // Inactivity gap
  const lastLogin = await ActivityLog.findOne({ userId, event: 'login' }, {}, { sort: { recordedAt: -1 } });
  const inactivityGap = lastLogin ? Math.floor((Date.now() - new Date(lastLogin.recordedAt)) / (1000 * 60 * 60 * 24)) : 7;

  // Meal logging rate
  const mealsLastWeek = await MealLog.countDocuments({ userId, loggedDate: { $gte: sevenDaysStr } });
  const mealLoggingRate = mealsLastWeek / 7;

  // Workout completion rate
  const workoutsCompleted = recentActivity.filter(a => a.event === 'workout_completed').length;
  const workoutsSkipped = recentActivity.filter(a => a.event === 'workout_skipped').length;
  const totalWorkoutEvents = workoutsCompleted + workoutsSkipped;
  const workoutCompletionRate = totalWorkoutEvents > 0 ? workoutsCompleted / totalWorkoutEvents : 0;

  // Chatbot interactions
  const chatbotInteractions = recentActivity.filter(a => a.event === 'chatbot_message').length;

  // Streak
  let streakDays = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const hasActivity = recentActivity.some(a => a.recordedDate === dateStr);
    if (hasActivity) streakDays++;
    else break;
  }

  // Normalize
  const norm = {
    loginFrequency: normalize(loginFrequency, 0, 7),
    inactivityGap: 1 - normalize(inactivityGap, 0, 30),
    mealLoggingRate: normalize(mealLoggingRate, 0, 5),
    workoutCompletionRate,
    chatbotInteractions: normalize(chatbotInteractions, 0, 30),
    streakDays: normalize(streakDays, 0, 30)
  };

  const score = (
    0.25 * norm.loginFrequency +
    0.20 * norm.workoutCompletionRate +
    0.20 * norm.inactivityGap +
    0.15 * norm.mealLoggingRate +
    0.10 * norm.streakDays +
    0.05 * norm.chatbotInteractions +
    0.05 * norm.inactivityGap
  );

  const engagementScore = Math.min(1, parseFloat(score.toFixed(2)));
  const engagementLevel = engagementScore > 0.65 ? 'High' : engagementScore >= 0.35 ? 'Medium' : 'Low';

  return {
    engagementScore,
    engagementLevel,
    features: { loginFrequency, inactivityGap, mealLoggingRate, workoutCompletionRate, chatbotInteractions, streakDays }
  };
}

const getEngagementScore = async (req, res) => {
  try {
    const result = await computeEngagementScore(req.user._id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getEngagementHistory = async (req, res) => {
  try {
    // For phase 1, return simplified history
    const days = 7;
    const history = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayActivity = await ActivityLog.find({ userId: req.user._id, recordedDate: dateStr });
      const hasLogin = dayActivity.some(a => a.event === 'login');
      history.push({ date: dateStr, active: hasLogin, events: dayActivity.length });
    }
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getEngagementScore, getEngagementHistory, computeEngagementScore };
