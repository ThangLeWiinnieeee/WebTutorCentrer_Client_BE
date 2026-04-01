const express = require("express");
const router = express.Router();

const authController = require("./auth.controller");
const { registerSchema, loginSchema, validate } = require("./auth.validation");
const authMiddleware = require("../../core/middlewares/auth.middleware");

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/logout", authMiddleware, authController.logout);
router.post("/refresh-token", authController.refreshToken);
router.get("/me", authMiddleware, authController.getMe);

module.exports = router;
