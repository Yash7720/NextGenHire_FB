const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

// All notification routes must be protected
router.use(protect);

router.route('/')
  .get(notificationController.getNotifications);

router.route('/read')
  .put(notificationController.markAsRead);

module.exports = router;