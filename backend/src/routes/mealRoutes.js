const express = require('express');
const router = express.Router();
const { searchFood, logMeal, getTodayMeals, getMealHistory, deleteMeal } = require('../controllers/mealController');
const { protect } = require('../middleware/authMiddleware');

router.get('/search', protect, searchFood);
router.post('/log', protect, logMeal);
router.get('/today', protect, getTodayMeals);
router.get('/history', protect, getMealHistory);
router.delete('/:mealId', protect, deleteMeal);

module.exports = router;
