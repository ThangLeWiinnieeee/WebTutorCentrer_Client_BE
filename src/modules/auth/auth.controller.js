const authService = require("./auth.service");
const { successResponse } = require("../../core/utils/response");
const { REFRESH_TOKEN_COOKIE_OPTIONS } = require("../../core/utils/token");
const MESSAGE = require("../../core/constants/message");
const HTTP_STATUS = require("../../core/constants/status");

const register = async (req, res, next) => {
  try {
    const { email } = await authService.register(req.body);

    return successResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: MESSAGE.OTP_SENT,
      data: { email },
    });
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { accessToken, refreshToken, user } = await authService.verifyOtp(req.body);

    res.cookie("refreshToken", refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.OTP_VERIFY_SUCCESS,
      data: { accessToken, user },
    });
  } catch (error) {
    next(error);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const { email } = await authService.resendOtp(req.body);

    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.OTP_RESENT,
      data: { email },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { accessToken, refreshToken, user } = await authService.login(req.body);

    res.cookie("refreshToken", refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.LOGIN_SUCCESS,
      data: { accessToken, user },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.LOGOUT_SUCCESS,
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    const { accessToken, refreshToken: newRefreshToken } = await authService.refreshToken(token);

    res.cookie("refreshToken", newRefreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.REFRESH_TOKEN_SUCCESS,
      data: { accessToken },
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = await authService.forgotPassword(req.body);

    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.FORGOT_PASSWORD_OTP_SENT,
      data: { email },
    });
  } catch (error) {
    next(error);
  }
};

const verifyForgotPasswordOtp = async (req, res, next) => {
  try {
    const { resetToken } = await authService.verifyForgotPasswordOtp(req.body);

    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.FORGOT_PASSWORD_OTP_VERIFY_SUCCESS,
      data: { resetToken },
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body);

    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.RESET_PASSWORD_SUCCESS,
    });
  } catch (error) {
    next(error);
  }
};

const getUserInfo = async (req, res, next) => {
  try {
    const user = await authService.getUserInfo(req.user.id);

    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.USER_INFO_SUCCESS,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  forgotPassword,
  verifyForgotPasswordOtp,
  resetPassword,
  login,
  logout,
  refreshToken,
  getUserInfo,
};
