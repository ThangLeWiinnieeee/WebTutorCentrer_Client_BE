const express = require("express");
const router = express.Router();

const userController = require("./user.controller");
const { updateProfileSchema, validate } = require("./user.validation");
const authMiddleware = require("../../core/middlewares/auth.middleware");
const { uploadAvatarMiddleware } = require("../../core/utils/upload");

router.get("/user-info", authMiddleware, userController.getUserInfo);
router.post("/upload-avatar", authMiddleware, uploadAvatarMiddleware, userController.uploadAvatar);
router.patch("/update-profile", authMiddleware, validate(updateProfileSchema), userController.updateProfile);

module.exports = router;
