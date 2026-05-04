const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },

  profile: {
    age: { type: Number, min: 10, max: 100 },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    height: { type: Number },
    currentWeight: { type: Number },
    targetWeight: { type: Number },
    bmi: { type: Number },
    dailyCalorieTarget: { type: Number },
    fitnessGoal: { type: String, enum: ['Weight Loss', 'Muscle Gain', 'Stay Fit', 'Improve Stamina'] },
    activityLevel: { type: String, enum: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'] },
    dietaryPreference: { type: String, enum: ['Vegetarian', 'Non Vegetarian', 'Vegan', 'No Preference'] },
    profileComplete: { type: Boolean, default: false },
    profileCompletedAt: { type: Date }
  },

  weightHistory: [{ weight: Number, recordedAt: { type: Date, default: Date.now } }],

  auth: {
    lastLogin: { type: Date },
    loginCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  }
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
