import Notification from '../model/Notification.js';

// @desc    Create a new notification
// @route   POST /api/notifications
// @access  Public
export const createNotification = async (req, res) => {
  const { orderId, message } = req.body;

  if (!orderId || !message) {
    return res.status(400).json({ success: false, message: 'Missing orderId or message' });
  }

  try {
    const notification = new Notification({ orderId, message });
    await notification.save();

    // (Optional) Emit via Socket.IO if available
    if (req.io) {
      req.io.emit('new_notification', notification);
    }

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all notifications (sorted newest first)
// @route   GET /api/notifications
// @access  Public
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id
// @access  Public
export const markNotificationRead = async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete all notifications
// @route   DELETE /api/notifications
// @access  Public
export const deleteAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany();
    res.json({ success: true, message: 'All notifications deleted' });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};