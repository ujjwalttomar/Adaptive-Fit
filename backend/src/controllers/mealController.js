const MealLog = require('../models/MealLog');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const axios = require('axios');

const getTodayDate = () => new Date().toISOString().split('T')[0];

const COMMON_FOODS = [
  { name: 'Rice (cooked)', calories: 130, protein: 3, carbohydrates: 28, fats: 0, fiber: 0 },
  { name: 'Chicken Breast (grilled)', calories: 165, protein: 31, carbohydrates: 0, fats: 4, fiber: 0 },
  { name: 'Dal (cooked)', calories: 116, protein: 9, carbohydrates: 20, fats: 1, fiber: 8 },
  { name: 'Roti (wheat)', calories: 297, protein: 10, carbohydrates: 61, fats: 2, fiber: 5 },
  { name: 'Banana', calories: 89, protein: 1, carbohydrates: 23, fats: 0, fiber: 3 },
  { name: 'Oats (cooked)', calories: 71, protein: 2, carbohydrates: 12, fats: 1, fiber: 2 },
  { name: 'Egg (boiled)', calories: 155, protein: 13, carbohydrates: 1, fats: 11, fiber: 0 },
  { name: 'Milk (whole)', calories: 61, protein: 3, carbohydrates: 5, fats: 3, fiber: 0 },
  { name: 'Paneer', calories: 265, protein: 18, carbohydrates: 3, fats: 21, fiber: 0 },
  { name: 'Moong Dal', calories: 105, protein: 7, carbohydrates: 19, fats: 0, fiber: 8 },
  { name: 'Brown Rice (cooked)', calories: 111, protein: 3, carbohydrates: 23, fats: 1, fiber: 2 },
  { name: 'Salmon (grilled)', calories: 208, protein: 28, carbohydrates: 0, fats: 10, fiber: 0 },
  { name: 'Apple', calories: 52, protein: 0, carbohydrates: 14, fats: 0, fiber: 2 },
  { name: 'Greek Yogurt', calories: 59, protein: 10, carbohydrates: 4, fats: 0, fiber: 0 },
  { name: 'Sweet Potato (boiled)', calories: 76, protein: 1, carbohydrates: 18, fats: 0, fiber: 3 },
  { name: 'Almond', calories: 576, protein: 21, carbohydrates: 22, fats: 49, fiber: 13 },
  { name: 'Idli', calories: 58, protein: 2, carbohydrates: 12, fats: 0, fiber: 0 },
  { name: 'Dosa', calories: 133, protein: 4, carbohydrates: 22, fats: 4, fiber: 1 },
  { name: 'Sambar', calories: 55, protein: 3, carbohydrates: 10, fats: 1, fiber: 2 },
  { name: 'Curd (yogurt)', calories: 61, protein: 3, carbohydrates: 5, fats: 3, fiber: 0 },
];

const searchFood = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query?.trim()) {
      return res.status(400).json({ success: false, message: 'Query required' });
    }

    try {
      const response = await axios.get(
        `https://world.openfoodfacts.org/cgi/search.pl`,
        {
          params: {
            search_terms: query,
            search_simple: 1,
            action: 'process',
            json: 1,
            page_size: 15,
            fields: 'product_name,nutriments'
          },
          timeout: 5000 // 5 second timeout
        }
      );

      const products = response.data?.products || [];
      const results = products
        .filter(p => p.product_name && p.nutriments && p.nutriments['energy-kcal_100g'] > 0)
        .slice(0, 8)
        .map(p => ({
          name: p.product_name.trim(),
          calories: Math.round(p.nutriments['energy-kcal_100g'] || p.nutriments['energy-kcal'] || 0),
          protein: Math.round(p.nutriments['proteins_100g'] || 0),
          carbohydrates: Math.round(p.nutriments['carbohydrates_100g'] || 0),
          fats: Math.round(p.nutriments['fat_100g'] || 0),
          fiber: Math.round(p.nutriments['fiber_100g'] || 0),
        }));

      if (results.length > 0) {
        return res.json({ success: true, results, source: 'openfoodfacts' });
      }
    } catch {
      // Fall through to local fallback
    }

    // Local fallback
    const q = query.toLowerCase();
    const filtered = COMMON_FOODS.filter(f => f.name.toLowerCase().includes(q));
    return res.json({
      success: true,
      results: filtered.length > 0 ? filtered : COMMON_FOODS.slice(0, 8),
      source: 'local'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const logMeal = async (req, res) => {
  try {
    const { mealType, foodName, portionSize, calories, protein, carbohydrates, fats, fiber } = req.body;
    if (!mealType || !foodName) {
      return res.status(400).json({ success: false, message: 'Meal type and food name required' });
    }

    const portion = Number(portionSize) || 100;
    const factor = portion / 100;

    const meal = await MealLog.create({
      userId: req.user._id,
      loggedDate: getTodayDate(),
      mealDetails: {
        mealType,
        foodName,
        portionSize: portion,
        nutritionInfo: {
          calories: Math.round((Number(calories) || 0) * factor),
          protein: Math.round((Number(protein) || 0) * factor),
          carbohydrates: Math.round((Number(carbohydrates) || 0) * factor),
          fats: Math.round((Number(fats) || 0) * factor),
          fiber: Math.round((Number(fiber) || 0) * factor)
        }
      }
    });

    await ActivityLog.create({
      userId: req.user._id,
      event: 'meal_logged',
      eventDetails: { mealId: meal._id }
    });

    const user = await User.findById(req.user._id);
    const todayMeals = await MealLog.find({ userId: req.user._id, loggedDate: getTodayDate() });
    const totalCaloriesToday = todayMeals.reduce((sum, m) => sum + m.mealDetails.nutritionInfo.calories, 0);

    res.status(201).json({
      success: true,
      mealLog: meal,
      dailySummary: {
        totalCaloriesToday,
        remainingCalories: (user.profile.dailyCalorieTarget || 2000) - totalCaloriesToday,
        dailyTarget: user.profile.dailyCalorieTarget || 2000
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getTodayMeals = async (req, res) => {
  try {
    const today = getTodayDate();
    const meals = await MealLog.find({ userId: req.user._id, loggedDate: today }).sort({ loggedAt: -1 });
    const user = await User.findById(req.user._id);

    const totals = meals.reduce((acc, m) => {
      acc.calories += m.mealDetails.nutritionInfo.calories;
      acc.protein += m.mealDetails.nutritionInfo.protein;
      acc.carbs += m.mealDetails.nutritionInfo.carbohydrates;
      acc.fats += m.mealDetails.nutritionInfo.fats;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

    const dailyTarget = user.profile.dailyCalorieTarget || 2000;

    res.json({
      success: true,
      meals,
      dailySummary: {
        ...totals,
        dailyTarget,
        remainingCalories: dailyTarget - totals.calories,
        percentageConsumed: Math.round((totals.calories / dailyTarget) * 100)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMealHistory = async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 7, 30);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString().split('T')[0];

    const meals = await MealLog.find({
      userId: req.user._id,
      loggedDate: { $gte: startStr }
    }).sort({ loggedDate: -1 });

    const grouped = {};
    meals.forEach(meal => {
      const d = meal.loggedDate;
      if (!grouped[d]) grouped[d] = { date: d, totalCalories: 0, meals: [] };
      grouped[d].totalCalories += meal.mealDetails.nutritionInfo.calories;
      grouped[d].meals.push(meal);
    });

    res.json({
      success: true,
      history: Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteMeal = async (req, res) => {
  try {
    const meal = await MealLog.findOne({ _id: req.params.mealId, userId: req.user._id });
    if (!meal) return res.status(404).json({ success: false, message: 'Meal not found' });
    await meal.deleteOne();
    res.json({ success: true, message: 'Meal deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { searchFood, logMeal, getTodayMeals, getMealHistory, deleteMeal };
