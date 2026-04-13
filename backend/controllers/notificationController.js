const Notification = require("../models/Notification");

// Fetch notifications for the logged-in user
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50); // Optional limit to keep it fast
    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mark all unread notifications as read for the user
exports.markAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, unread: true },
      { $set: { unread: false } }
    );
    res.json({ success: true, message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Internal utility to push notifications from other controllers
exports.createNotification = async (userId, text, type = 'system') => {
  try {
    const notification = await Notification.create({
      userId,
      text,
      type,
      unread: true
    });
    return notification;
  } catch (error) {
    console.error("Failed to create notification inside helper:", error.message);
  }
};