const express = require('express');
const router = express.Router();
const { generatePlan, getPlan, getTodayWorkout, completeWorkout, skipWorkout, getExercises } = require('../controllers/workoutController');
const { protect } = require('../middleware/authMiddleware');

router.post('/plan/generate', protect, generatePlan);
router.get('/plan', protect, getPlan);
router.get('/today', protect, getTodayWorkout);
router.post('/complete', protect, completeWorkout);
router.post('/skip', protect, skipWorkout);
router.get('/exercises', protect, getExercises);

module.exports = router;
