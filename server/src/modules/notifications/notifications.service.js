import Notification from "../../models/Notification.js";
import { getIO } from "../../sockets/index.js";

export const createNotification = async ({ recipient, title, message, type = "GENERAL" }) => {
  try {
    const notif = await Notification.create({
      recipient,
      title,
      message,
      type,
    });

    try {
      getIO().to(`user:${recipient.toString()}`).emit("notification:new", notif);
    } catch (e) {
      // Socket not initialized or client disconnected
    }

    return notif;
  } catch (err) {
    console.error("⚠️ Failed to create notification:", err.message);
  }
};

export const getNotificationsForUser = async (userId, query = {}) => {
  const { page = 1, limit = 20 } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Notification.countDocuments({ recipient: userId }),
    Notification.countDocuments({ recipient: userId, isRead: false }),
  ]);

  return {
    notifications,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
      unreadCount,
    },
  };
};

export const markNotificationAsRead = async (notificationId, userId) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { $set: { isRead: true } },
    { new: true }
  );
  return notif;
};
