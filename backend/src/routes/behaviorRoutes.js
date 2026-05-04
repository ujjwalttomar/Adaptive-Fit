const express = require('express');
const router = express.Router();
const { getEngagementScore, getEngagementHistory } = require('../controllers/behaviorController');
const { protect } = require('../middleware/authMiddleware');
router.get('/score', protect, getEngagementScore);
router.get('/history', protect, getEngagementHistory);
module.exports = router;
