const Notification = require("../models/Notification");

const getMyNotifications = async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: notifications });
};

const markRead = async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { read: true });
  res.json({ success: true, message: "Marked as read" });
};

const markAllRead = async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  res.json({ success: true, message: "All marked as read" });
};

module.exports = { getMyNotifications, markRead, markAllRead };