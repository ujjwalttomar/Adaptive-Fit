const User = require('../models/User');
const MealLog = require('../models/MealLog');
const WorkoutPlan = require('../models/WorkoutPlan');
const ActivityLog = require('../models/ActivityLog');
const { computeEngagementScore } = require('./behaviorController');

const getTodayDate = () => new Date().toISOString().split('T')[0];
const getTodayDayName = () => ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];

const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = getTodayDate();
    const user = await User.findById(userId);

    // Today's nutrition
    const meals = await MealLog.find({ userId, loggedDate: today });
    const totalCalories = meals.reduce((s, m) => s + m.mealDetails.nutritionInfo.calories, 0);
    const totalProtein = meals.reduce((s, m) => s + m.mealDetails.nutritionInfo.protein, 0);
    const totalCarbs = meals.reduce((s, m) => s + m.mealDetails.nutritionInfo.carbohydrates, 0);
    const totalFats = meals.reduce((s, m) => s + m.mealDetails.nutritionInfo.fats, 0);

    // Today's workout
    const plan = await WorkoutPlan.findOne({ userId, 'planDetails.isActive': true });
    const dayName = getTodayDayName();
    const todayWorkout = plan?.weeklySchedule?.[dayName];

    // Engagement
    const engagement = await computeEngagementScore(userId);

    // Last 7 days calorie data for chart
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayMeals = await MealLog.find({ userId, loggedDate: dateStr });
      const dayCals = dayMeals.reduce((s, m) => s + m.mealDetails.nutritionInfo.calories, 0);
      weeklyData.push({ date: dateStr, day: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()], calories: dayCals, target: user.profile.dailyCalorieTarget || 2000 });
    }

    const progressScore = Math.round(engagement.engagementScore * 100);

    res.json({
      success: true,
      dashboard: {
        user: { name: user.fullName, goal: user.profile.fitnessGoal, currentWeight: user.profile.currentWeight, targetWeight: user.profile.targetWeight, bmi: user.profile.bmi },
        todayNutrition: { consumed: totalCalories, target: user.profile.dailyCalorieTarget || 2000, remaining: (user.profile.dailyCalorieTarget || 2000) - totalCalories, percentage: Math.min(100, Math.round((totalCalories / (user.profile.dailyCalorieTarget || 2000)) * 100)), mealsLogged: meals.length, protein: totalProtein, carbs: totalCarbs, fats: totalFats },
        todayWorkout: { type: todayWorkout?.workoutType || 'Not set', isRestDay: todayWorkout?.isRestDay || false, completed: todayWorkout?.exercises?.every(e => e.completed) || false, duration: todayWorkout?.totalEstimatedDuration || 0, calories: todayWorkout?.totalEstimatedCalories || 0, planExists: !!plan },
        engagement: { score: Math.round(engagement.engagementScore * 100), level: engagement.engagementLevel, streak: engagement.features.streakDays },
        weeklyData,
        progressScore,
        weightHistory: user.weightHistory?.slice(-7) || []
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboard };
