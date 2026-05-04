const mongoose = require('mongoose');

const mealLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mealDetails: {
    mealType: { type: String, enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'], required: true },
    foodName: { type: String, required: true },
    portionSize: { type: Number },
    nutritionInfo: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbohydrates: { type: Number, default: 0 },
      fats: { type: Number, default: 0 },
      fiber: { type: Number, default: 0 }
    }
  },
  loggedAt: { type: Date, default: Date.now },
  loggedDate: { type: String }
});

mealLogSchema.pre('save', function(next) {
  if (!this.loggedDate) {
    const d = new Date();
    this.loggedDate = d.toISOString().split('T')[0];
  }
  next();
});

module.exports = mongoose.model('MealLog', mealLogSchema);
