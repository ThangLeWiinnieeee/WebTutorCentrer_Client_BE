const express = require("express");
const router = express.Router();

const authController = require("./auth.controller");
const { registerSchema, loginSchema, verifyOtpSchema, resendOtpSchema, validate } = require("./auth.validation");
const authMiddleware = require("../../core/middlewares/auth.middleware");

router.post("/register", validate(registerSchema), authController.register);
router.post("/verify-otp", validate(verifyOtpSchema), authController.verifyOtp);
router.post("/resend-otp", validate(resendOtpSchema), authController.resendOtp);
router.post("/login", validate(loginSchema), authController.login);
router.post("/logout", authMiddleware, authController.logout);
router.post("/refresh-token", authController.refreshToken);
router.get("/user-info", authMiddleware, authController.getUserInfo);

module.exports = router;
