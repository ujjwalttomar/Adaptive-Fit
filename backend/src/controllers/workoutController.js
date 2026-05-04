const WorkoutPlan = require('../models/WorkoutPlan');
const ActivityLog = require('../models/ActivityLog');
const exerciseDB = require('../utils/exerciseDatabase.json');

const getTodayDayName = () => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
};

function selectExercises(workoutType, difficulty) {
  const categoryMap = {
    'Cardio': ['Cardio'],
    'Strength': ['Strength'],
    'Core': ['Core'],
    'Flexibility': ['Flexibility'],
    'Rest': []
  };
  const cats = categoryMap[workoutType] || ['Cardio', 'Strength'];
  const diff = difficulty.toLowerCase();

  const filtered = exerciseDB.exercises.filter(e => cats.includes(e.category));
  // Shuffle and pick 4
  const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, 4);

  return shuffled.map(ex => ({
    exerciseName: ex.name,
    sets: ex[diff]?.sets ?? 3,
    reps: ex[diff]?.reps ?? 12,
    duration: ex[diff]?.duration ?? 0,
    restBetweenSets: ex[diff]?.rest ?? 60,
    estimatedCalories: ex[diff]?.calories ?? 40,
    completed: false
  }));
}

function buildDaySchedule(workoutType, difficulty) {
  if (workoutType === 'Rest') {
    return { isRestDay: true, workoutType: 'Rest', exercises: [], totalEstimatedDuration: 0, totalEstimatedCalories: 0 };
  }
  const exercises = selectExercises(workoutType, difficulty);
  const totalCalories = exercises.reduce((s, e) => s + e.estimatedCalories, 0);
  const totalDuration = exercises.reduce((s, e) => {
    const exerciseTime = e.duration ? (e.sets * e.duration) / 60 : (e.sets * e.reps * 3) / 60;
    const restTime = (e.sets - 1) * e.restBetweenSets / 60;
    return s + exerciseTime + restTime;
  }, 0);
  return {
    isRestDay: false,
    workoutType,
    exercises,
    totalEstimatedDuration: Math.max(10, Math.round(totalDuration)),
    totalEstimatedCalories: totalCalories
  };
}

const generatePlan = async (req, res) => {
  try {
    const user = req.user;
    if (!user.profile.profileComplete) {
      return res.status(400).json({ success: false, message: 'Complete your profile first' });
    }

    // Deactivate existing plans
    await WorkoutPlan.updateMany({ userId: user._id }, { 'planDetails.isActive': false });

    const goal = user.profile.fitnessGoal || 'Stay Fit';
    const activityLevel = user.profile.activityLevel || 'Sedentary';

    let difficulty = 'Beginner';
    if (activityLevel === 'Moderately Active') difficulty = 'Intermediate';
    if (activityLevel === 'Very Active') difficulty = 'Advanced';

    const split = exerciseDB.workoutSplits?.[goal] || exerciseDB.workoutSplits?.['Stay Fit'];
    if (!split) {
      return res.status(500).json({ success: false, message: 'Workout split not found' });
    }

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const weeklySchedule = {};
    days.forEach(day => {
      weeklySchedule[day] = buildDaySchedule(split[day] || 'Rest', difficulty);
    });

    const workoutDays = days.filter(d => !weeklySchedule[d].isRestDay).length;

    const plan = await WorkoutPlan.create({
      userId: user._id,
      planDetails: {
        planName: `${goal} · ${difficulty} Plan`,
        fitnessGoal: goal,
        currentDifficulty: difficulty,
        weekNumber: 1,
        startDate: new Date(),
        isActive: true
      },
      weeklySchedule,
      planStats: {
        totalWorkoutsPlanned: workoutDays,
        totalWorkoutsCompleted: 0,
        completionRate: 0,
        totalCaloriesBurned: 0
      }
    });

    res.status(201).json({ success: true, plan });
  } catch (err) {
    console.error('generatePlan error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getPlan = async (req, res) => {
  try {
    const plan = await WorkoutPlan.findOne({ userId: req.user._id, 'planDetails.isActive': true });
    if (!plan) return res.status(404).json({ success: false, message: 'No active plan found' });
    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getTodayWorkout = async (req, res) => {
  try {
    const plan = await WorkoutPlan.findOne({ userId: req.user._id, 'planDetails.isActive': true });
    if (!plan) return res.status(404).json({ success: false, message: 'No active plan. Generate a plan first.' });
    const today = getTodayDayName();
    res.json({
      success: true,
      today,
      workout: plan.weeklySchedule[today],
      difficulty: plan.planDetails.currentDifficulty
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const completeWorkout = async (req, res) => {
  try {
    const { day } = req.body;
    const dayName = day || getTodayDayName();

    const plan = await WorkoutPlan.findOne({ userId: req.user._id, 'planDetails.isActive': true });
    if (!plan) return res.status(404).json({ success: false, message: 'No active plan' });

    const dayWorkout = plan.weeklySchedule.get ? plan.weeklySchedule[dayName] : plan.weeklySchedule[dayName];
    if (!dayWorkout) return res.status(400).json({ success: false, message: 'Day not found in plan' });

    // Mark all exercises completed
    dayWorkout.exercises.forEach(ex => {
      ex.completed = true;
      ex.completedAt = new Date();
    });

    const caloriesBurned = dayWorkout.totalEstimatedCalories || 0;
    plan.planStats.totalWorkoutsCompleted += 1;
    plan.planStats.totalCaloriesBurned += caloriesBurned;
    plan.planStats.completionRate = plan.planStats.totalWorkoutsCompleted / Math.max(1, plan.planStats.totalWorkoutsPlanned);
    plan.updatedAt = new Date();

    // Must mark the nested path as modified for Mongoose to save it
    plan.markModified('weeklySchedule');
    plan.markModified('planStats');
    await plan.save();

    await ActivityLog.create({ userId: req.user._id, event: 'workout_completed' });

    res.json({ success: true, message: 'Workout completed!', caloriesBurned });
  } catch (err) {
    console.error('completeWorkout error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const skipWorkout = async (req, res) => {
  try {
    await ActivityLog.create({ userId: req.user._id, event: 'workout_skipped' });
    res.json({ success: true, message: 'Workout skipped' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getExercises = async (req, res) => {
  try {
    const { category } = req.query;
    let exercises = exerciseDB.exercises;
    if (category) exercises = exercises.filter(e => e.category === category);
    res.json({ success: true, exercises });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { generatePlan, getPlan, getTodayWorkout, completeWorkout, skipWorkout, getExercises };
