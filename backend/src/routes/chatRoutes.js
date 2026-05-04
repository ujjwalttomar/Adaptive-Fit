const express = require('express');
const router = express.Router();
const { sendMessage, getChatHistory, getSession } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
router.post('/message', protect, sendMessage);
router.get('/history', protect, getChatHistory);
router.get('/session/:sessionId', protect, getSession);
module.exports = router;
