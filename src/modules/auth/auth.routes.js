const express = require("express");
const router = express.Router();

const authController = require("./auth.controller");
const {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  verifyForgotPasswordOtpSchema,
  resetPasswordSchema,
  updateProfileSchema,
  validate,
} = require("./auth.validation");
const authMiddleware = require("../../core/middlewares/auth.middleware");
const { uploadAvatarMiddleware } = require("../../core/utils/upload");

// Đăng ký
router.post("/register", validate(registerSchema), authController.register);
router.post("/verify-otp", validate(verifyOtpSchema), authController.verifyOtp);
router.post("/resend-otp", validate(resendOtpSchema), authController.resendOtp);

// Đăng nhập / Đăng xuất
router.post("/google", authController.googleLogin);
router.post("/login", validate(loginSchema), authController.login);
router.post("/logout", authMiddleware, authController.logout);
router.post("/refresh-token", authController.refreshToken);

// Quên mật khẩu
router.post("/forgot-password", validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/verify-forgot-password-otp", validate(verifyForgotPasswordOtpSchema), authController.verifyForgotPasswordOtp);
router.post("/reset-password", validate(resetPasswordSchema), authController.resetPassword);

// Thông tin người dùng
router.get("/user-info", authMiddleware, authController.getUserInfo);
router.post("/upload-avatar", authMiddleware, uploadAvatarMiddleware, authController.uploadAvatar);
router.patch("/update-profile", authMiddleware, validate(updateProfileSchema), authController.updateProfile);

module.exports = router;
