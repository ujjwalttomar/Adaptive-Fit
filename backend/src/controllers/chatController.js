const ChatLog = require('../models/ChatLog');
const ActivityLog = require('../models/ActivityLog');
const MealLog = require('../models/MealLog');
const WorkoutPlan = require('../models/WorkoutPlan');
const User = require('../models/User');
const { computeEngagementScore } = require('./behaviorController');

const getTodayDate = () => new Date().toISOString().split('T')[0];
const getTodayDayName = () => ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];

function detectIntent(message) {
  const msg = message.toLowerCase();

  if (/\b(hi|hello|hey|good morning|good evening|sup|yo)\b/.test(msg)) return 'greeting';
  if (/\b(bye|goodbye|see you|thanks bye|cya)\b/.test(msg)) return 'goodbye';
  if (/\b(your name|who are you|what are you)\b/.test(msg)) return 'bot_name';
  if (/\b(what can you|help me with|your capabilities|how can you help)\b/.test(msg)) return 'capabilities';
  if (/\b(thank|thanks|thank you|thx)\b/.test(msg)) return 'thank_you';

  if (/\b(calorie.*today|today.*calorie|how much.*eat|eaten today|intake today|calories? (consumed|eaten|had))\b/.test(msg)) return 'calories_today';
  if (/\b(remaining|left|how much more|still eat|can i eat)\b/.test(msg)) return 'remaining_calories';
  if (/\b(protein|carb|fat|macro|nutrition today)\b/.test(msg)) return 'macros_today';
  if (/\b(meal.*today|what.*eat|today.*meal|my meal|food.*log)\b/.test(msg)) return 'meals_today';

  if (/\b(workout.*today|today.*workout|exercise.*today|my exercise|what.*workout)\b/.test(msg)) return 'todays_workout';
  if (/\b(weekly.*plan|my.*plan|this week|week.*workout|schedule)\b/.test(msg)) return 'weekly_plan';
  if (/\b(complete|finish|done|completed.*workout|workout.*done)\b/.test(msg)) return 'complete_workout';
  if (/\b(skip|skip.*workout|too tired|rest today)\b/.test(msg)) return 'skip_workout';
  if (/\b(easier|too hard|reduce|lighter|simplify)\b/.test(msg)) return 'easier_workout';

  if (/\b(streak|consecutive|days in row|how many days)\b/.test(msg)) return 'streak';
  if (/\b(progress|how am i|doing well|performance|score)\b/.test(msg)) return 'progress';
  if (/\b(weight|bmi|body mass)\b/.test(msg)) return 'weight_info';

  if (/\b(motivat|inspire|encourage|push me|lazy|dont want|don't want|give up|quit)\b/.test(msg)) return 'motivation';
  if (/\b(tired|exhausted|no energy|feeling low|demotivat)\b/.test(msg)) return 'feeling_tired';

  if (/\b(tip|advice|suggest|recommend|healthy)\b/.test(msg)) return 'tips';
  if (/\b(water|hydrat|drink)\b/.test(msg)) return 'water_advice';

  return 'fallback';
}

async function generateResponse(intent, userId) {
  const user = await User.findById(userId);
  const today = getTodayDate();

  switch (intent) {
    case 'greeting': {
      const hour = new Date().getHours();
      const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      return { text: `${greet}, ${user.fullName.split(' ')[0]}! 👋 I am your AdaptiveFit assistant. How can I help you today?`, quickReplies: ['Calories today', 'Today\'s workout', 'My progress', 'Motivate me'] };
    }
    case 'goodbye':
      return { text: `Goodbye, ${user.fullName.split(' ')[0]}! Stay consistent and keep pushing! 💪`, quickReplies: [] };
    case 'bot_name':
      return { text: 'I am AdaptiveFit Assistant — your personal health and fitness coach! I can help you track calories, manage workouts, and keep you motivated. 🤖', quickReplies: ['What can you do?', 'Show my calories', 'Today\'s workout'] };
    case 'capabilities':
      return { text: 'I can help you with:\n📊 Calorie tracking and nutrition info\n🏋️ Workout plans and exercise guidance\n📈 Progress and engagement score\n💪 Motivation and fitness tips\n\nJust ask me anything!', quickReplies: ['My calories today', 'Today\'s workout', 'My streak'] };
    case 'thank_you':
      return { text: 'You\'re welcome! Keep up the great work! 🌟', quickReplies: ['Show calories', 'Show workout', 'Motivate me'] };

    case 'calories_today': {
      const meals = await MealLog.find({ userId, loggedDate: today });
      const total = meals.reduce((s, m) => s + m.mealDetails.nutritionInfo.calories, 0);
      const target = user.profile.dailyCalorieTarget || 2000;
      return { text: `Today you have consumed **${total} kcal** out of your **${target} kcal** daily target.\n\n${total < target ? `You have ${target - total} kcal remaining. Keep it up! 🌱` : `You've hit your calorie goal for today! 🎉`}`, quickReplies: ['Show my meals', 'Remaining calories', 'Macro breakdown'] };
    }
    case 'remaining_calories': {
      const meals = await MealLog.find({ userId, loggedDate: today });
      const total = meals.reduce((s, m) => s + m.mealDetails.nutritionInfo.calories, 0);
      const target = user.profile.dailyCalorieTarget || 2000;
      const remaining = target - total;
      return { text: remaining > 0 ? `You have **${remaining} kcal** remaining for today. That's about ${Math.round(remaining / 400)} medium-sized meals! 🍽️` : `You've exceeded your daily target by ${Math.abs(remaining)} kcal. Consider lighter options for your next meal.`, quickReplies: ['What to eat?', 'Log a meal', 'Today\'s meals'] };
    }
    case 'macros_today': {
      const meals = await MealLog.find({ userId, loggedDate: today });
      const totals = meals.reduce((acc, m) => { acc.protein += m.mealDetails.nutritionInfo.protein; acc.carbs += m.mealDetails.nutritionInfo.carbohydrates; acc.fats += m.mealDetails.nutritionInfo.fats; return acc; }, { protein: 0, carbs: 0, fats: 0 });
      return { text: `Today's macro breakdown:\n🥩 Protein: **${totals.protein}g**\n🍞 Carbs: **${totals.carbs}g**\n🥑 Fats: **${totals.fats}g**`, quickReplies: ['Total calories', 'Log a meal'] };
    }
    case 'meals_today': {
      const meals = await MealLog.find({ userId, loggedDate: today }).sort({ loggedAt: -1 });
      if (meals.length === 0) return { text: 'You haven\'t logged any meals today yet! Head to the Meals section to log your first meal. 🍽️', quickReplies: ['Log a meal', 'My calorie target'] };
      const list = meals.map(m => `• ${m.mealDetails.mealType}: ${m.mealDetails.foodName} (${m.mealDetails.nutritionInfo.calories} kcal)`).join('\n');
      return { text: `Here are your meals today:\n\n${list}`, quickReplies: ['Total calories', 'Add another meal'] };
    }

    case 'todays_workout': {
      const plan = await WorkoutPlan.findOne({ userId, 'planDetails.isActive': true });
      if (!plan) return { text: 'You don\'t have a workout plan yet! Go to the Workouts section to generate your personalized plan. 💪', quickReplies: ['How to get a plan?'] };
      const dayName = getTodayDayName();
      const workout = plan.weeklySchedule[dayName];
      if (workout.isRestDay) return { text: 'Today is your **rest day**! 😴 Recovery is just as important as training. Use this time to stretch, hydrate, and recharge for tomorrow!', quickReplies: ['Tomorrow\'s workout', 'Stretching tips'] };
      const exercises = workout.exercises.map(e => `• ${e.exerciseName}: ${e.sets} sets × ${e.reps > 0 ? e.reps + ' reps' : e.duration + 's'}`).join('\n');
      return { text: `Today's workout: **${workout.workoutType}** 🏋️\n\n${exercises}\n\n⏱️ Duration: ~${workout.totalEstimatedDuration} min\n🔥 Calories: ~${workout.totalEstimatedCalories} kcal`, quickReplies: ['Mark as complete', 'Skip today', 'Too hard'] };
    }
    case 'streak': {
      const engagement = await computeEngagementScore(userId);
      return { text: `Your current streak is **${engagement.features.streakDays} days** 🔥\n\n${engagement.features.streakDays > 5 ? 'Amazing consistency! Keep it going!' : engagement.features.streakDays > 0 ? 'Good start! Try to build a longer streak!' : 'Start your streak today by logging in and completing a workout!'}`, quickReplies: ['My progress', 'Today\'s workout'] };
    }
    case 'progress': {
      const engagement = await computeEngagementScore(userId);
      const pct = Math.round(engagement.engagementScore * 100);
      return { text: `Your engagement score is **${pct}/100** (${engagement.engagementLevel}) 📊\n\n🔥 Streak: ${engagement.features.streakDays} days\n🏋️ Workout completion: ${Math.round(engagement.features.workoutCompletionRate * 100)}%\n🍽️ Meals/day: ${engagement.features.mealLoggingRate.toFixed(1)}`, quickReplies: ['How to improve?', 'Today\'s workout', 'Log a meal'] };
    }
    case 'weight_info':
      return { text: `Your current weight: **${user.profile.currentWeight} kg**\nTarget weight: **${user.profile.targetWeight || 'Not set'} kg**\nBMI: **${user.profile.bmi}**\n\nUpdate your weight in the Profile section to track your progress! 📉`, quickReplies: ['My progress', 'Edit profile'] };

    case 'motivation': {
      const msgs = [
        `You've got this, ${user.fullName.split(' ')[0]}! Every step counts. The hardest part is starting — and you've already done that! 💪`,
        `Remember why you started! Your goal is **${user.profile.fitnessGoal}** and every workout brings you closer. You're stronger than you think! 🔥`,
        `Champions are made in moments when they want to quit but don't. That's you right now. Push through! 🏆`,
        `Small progress is still progress. Even 10 minutes of movement today beats zero! 🌟`
      ];
      return { text: msgs[Math.floor(Math.random() * msgs.length)], quickReplies: ['Today\'s workout', 'Show my progress', 'Easy workout'] };
    }
    case 'feeling_tired':
      return { text: `It's okay to feel tired sometimes! Here are some options:\n\n1. **Do a lighter session** — even 15 minutes helps\n2. **Take a proper rest** if you're genuinely exhausted\n3. **Stretch and meditate** for 10 minutes\n\nListening to your body is part of fitness! 🌿`, quickReplies: ['Skip today', 'Easy exercises', 'Motivate me'] };

    case 'tips': {
      const tips = [
        '💧 Drink water before every meal — it reduces overeating and improves metabolism.',
        '😴 Sleep 7-9 hours. Muscle recovery happens during sleep, not during workouts!',
        '🎯 Consistency > Perfection. A moderate workout done daily beats an intense one done rarely.',
        '🍎 Fill half your plate with vegetables. They\'re filling, nutritious, and low calorie!',
        '⏰ Workout at the same time daily to build a habit that sticks.'
      ];
      return { text: `💡 Fitness Tip:\n\n${tips[Math.floor(Math.random() * tips.length)]}`, quickReplies: ['Another tip', 'Today\'s workout', 'Log a meal'] };
    }
    case 'water_advice':
      return { text: `💧 Daily Water Recommendation:\n\nAim for **${Math.round((user.profile.currentWeight || 70) * 0.033)} liters** per day (based on your weight).\n\nTips:\n• Drink a glass when you wake up\n• Drink before each meal\n• Carry a water bottle everywhere`, quickReplies: ['More tips', 'Nutrition advice'] };

    default:
      return { text: `I'm not sure I understood that! I can help you with:\n• Calorie & meal tracking\n• Workout plans & exercises\n• Progress & engagement score\n• Motivation & fitness tips\n\nTry asking: "How many calories today?" or "What's my workout?"`, quickReplies: ['Calories today', 'Today\'s workout', 'My progress', 'Motivate me'] };
  }
}

const sendMessage = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message required' });

    const sid = sessionId || `session_${req.user._id}_${Date.now()}`;

    let chatLog = await ChatLog.findOne({ userId: req.user._id, sessionId: sid });
    if (!chatLog) {
      chatLog = await ChatLog.create({ userId: req.user._id, sessionId: sid, messages: [] });
    }

    chatLog.messages.push({ sender: 'user', text: message, intent: null });

    await ActivityLog.create({ userId: req.user._id, event: 'chatbot_message' });

    const intent = detectIntent(message);
    const response = await generateResponse(intent, req.user._id);

    chatLog.messages.push({ sender: 'bot', text: response.text, intent });
    await chatLog.save();

    res.json({ success: true, sessionId: sid, response: { ...response, responseType: 'generated' }, intentDetails: { detectedIntent: intent } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const sessions = await ChatLog.find({ userId: req.user._id }).sort({ sessionStartedAt: -1 }).limit(10);
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSession = async (req, res) => {
  try {
    const session = await ChatLog.findOne({ userId: req.user._id, sessionId: req.params.sessionId });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, messages: session.messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { sendMessage, getChatHistory, getSession };
