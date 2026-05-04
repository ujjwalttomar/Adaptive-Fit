function calculateBMI(weight, height) {
  const heightM = height / 100;
  return parseFloat((weight / (heightM * heightM)).toFixed(1));
}

function calculateCalorieTarget(age, gender, weight, height, activityLevel, fitnessGoal) {
  let bmr;
  if (gender === 'Male') {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }

  const activityFactors = {
    'Sedentary': 1.2,
    'Lightly Active': 1.375,
    'Moderately Active': 1.55,
    'Very Active': 1.725
  };

  let tdee = bmr * (activityFactors[activityLevel] || 1.2);

  if (fitnessGoal === 'Weight Loss') tdee -= 500;
  else if (fitnessGoal === 'Muscle Gain') tdee += 300;

  return Math.round(tdee);
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function getTodayDayName() {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
}

function generateToken(id, email) {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id, email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

module.exports = { calculateBMI, calculateCalorieTarget, getTodayDate, getTodayDayName, generateToken };
