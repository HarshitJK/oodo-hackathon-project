import * as notificationService from "./notifications.service.js";

export const getNotifications = async (req, res, next) => {
  try {
    const data = await notificationService.getNotificationsForUser(req.user._id, req.query);
    res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notif = await notificationService.markNotificationAsRead(req.params.id, req.user._id);
    if (!notif) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
        errors: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      data: { notification: notif },
    });
  } catch (error) {
    next(error);
  }
};
