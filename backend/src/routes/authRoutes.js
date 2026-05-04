const express = require('express');
const router = express.Router();
const { register, login, setupProfile, updateProfile, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/profile/setup', protect, setupProfile);
router.put('/profile/update', protect, updateProfile);
router.get('/me', protect, getMe);

module.exports = router;
