const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  exerciseName: String,
  sets: Number,
  reps: Number,
  duration: Number,
  restBetweenSets: Number,
  estimatedCalories: Number,
  completed: { type: Boolean, default: false },
  completedAt: Date
});

const daySchema = new mongoose.Schema({
  isRestDay: { type: Boolean, default: false },
  workoutType: String,
  exercises: [exerciseSchema],
  totalEstimatedDuration: Number,
  totalEstimatedCalories: Number
});

const workoutPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planDetails: {
    planName: String,
    fitnessGoal: String,
    currentDifficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    weekNumber: { type: Number, default: 1 },
    startDate: Date,
    isActive: { type: Boolean, default: true }
  },
  weeklySchedule: {
    monday: daySchema,
    tuesday: daySchema,
    wednesday: daySchema,
    thursday: daySchema,
    friday: daySchema,
    saturday: daySchema,
    sunday: daySchema
  },
  planStats: {
    totalWorkoutsPlanned: { type: Number, default: 0 },
    totalWorkoutsCompleted: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    totalCaloriesBurned: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
