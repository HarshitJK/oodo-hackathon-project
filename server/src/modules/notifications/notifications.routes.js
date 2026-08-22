import express from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import * as notificationController from "./notifications.controller.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", notificationController.getNotifications);
router.patch("/:id/read", notificationController.markAsRead);

export default router;
