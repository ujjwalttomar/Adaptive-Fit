const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { calculateBMI, calculateCalorieTarget, generateToken } = require('../utils/calculations');

const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) return res.status(400).json({ success: false, message: 'All fields required' });
    if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ fullName, email, passwordHash });

    const token = generateToken(user._id, user.email);
    res.status(201).json({ success: true, message: 'Registration successful', token, user: { id: user._id, fullName: user.fullName, email: user.email, profileComplete: false } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    user.auth.lastLogin = new Date();
    user.auth.loginCount += 1;
    await user.save();

    await ActivityLog.create({ userId: user._id, event: 'login' });

    const token = generateToken(user._id, user.email);
    res.json({ success: true, token, user: { id: user._id, fullName: user.fullName, email: user.email, profileComplete: user.profile.profileComplete } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const setupProfile = async (req, res) => {
  try {
    const { age, gender, height, currentWeight, targetWeight, fitnessGoal, activityLevel, dietaryPreference } = req.body;
    if (!age || !gender || !height || !currentWeight || !fitnessGoal || !activityLevel) {
      return res.status(400).json({ success: false, message: 'All profile fields required' });
    }

    const bmi = calculateBMI(currentWeight, height);
    const dailyCalorieTarget = calculateCalorieTarget(age, gender, currentWeight, height, activityLevel, fitnessGoal);

    const user = await User.findByIdAndUpdate(req.user._id, {
      'profile.age': age, 'profile.gender': gender, 'profile.height': height,
      'profile.currentWeight': currentWeight, 'profile.targetWeight': targetWeight,
      'profile.fitnessGoal': fitnessGoal, 'profile.activityLevel': activityLevel,
      'profile.dietaryPreference': dietaryPreference, 'profile.bmi': bmi,
      'profile.dailyCalorieTarget': dailyCalorieTarget,
      'profile.profileComplete': true, 'profile.profileCompletedAt': new Date(),
      $push: { weightHistory: { weight: currentWeight } }
    }, { new: true }).select('-passwordHash');

    res.json({ success: true, message: 'Profile setup complete', user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.user._id);

    if (updates.currentWeight) {
      updates['profile.bmi'] = calculateBMI(updates.currentWeight, user.profile.height);
      updates['profile.dailyCalorieTarget'] = calculateCalorieTarget(user.profile.age, user.profile.gender, updates.currentWeight, user.profile.height, updates.activityLevel || user.profile.activityLevel, updates.fitnessGoal || user.profile.fitnessGoal);
      await User.findByIdAndUpdate(req.user._id, { $push: { weightHistory: { weight: updates.currentWeight } } });
    }

    const setUpdates = {};
    ['age', 'gender', 'height', 'currentWeight', 'targetWeight', 'fitnessGoal', 'activityLevel', 'dietaryPreference'].forEach(field => {
      if (updates[field] !== undefined) setUpdates[`profile.${field}`] = updates[field];
    });
    if (updates['profile.bmi']) setUpdates['profile.bmi'] = updates['profile.bmi'];
    if (updates['profile.dailyCalorieTarget']) setUpdates['profile.dailyCalorieTarget'] = updates['profile.dailyCalorieTarget'];

    const updatedUser = await User.findByIdAndUpdate(req.user._id, { $set: setUpdates, updatedAt: new Date() }, { new: true }).select('-passwordHash');
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

module.exports = { register, login, setupProfile, updateProfile, getMe };
