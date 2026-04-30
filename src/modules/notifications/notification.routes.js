const express = require("express");
const router = express.Router();
const authMiddleware = require("../../core/middlewares/auth.middleware");
const notificationController = require("./notification.controller");

router.use(authMiddleware);

router.get("/", notificationController.getNotifications);
router.patch("/:id/read", notificationController.markAsRead);
router.patch("/read-all", notificationController.markAllAsRead);

module.exports = router;
