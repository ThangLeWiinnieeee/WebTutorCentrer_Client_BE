const userRepository = require("../users/user.repository");
const { hashPassword, comparePassword } = require("../../core/utils/hash");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../../core/utils/token");
const MESSAGE = require("../../core/constants/message");
const HTTP_STATUS = require("../../core/constants/status");

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const register = async ({ fullName, email, password, role, phone }) => {
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw new AppError(MESSAGE.EMAIL_ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
  }

  const hashedPassword = await hashPassword(password);

  const user = await userRepository.create({
    fullName,
    email,
    password: hashedPassword,
    role,
    phone: phone || null,
  });

  const payload = { id: user._id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await userRepository.updateRefreshToken(user._id, refreshToken);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
    },
  };
};

const login = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email, true);
  if (!user) {
    throw new AppError(MESSAGE.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  if (!user.isActive) {
    throw new AppError("Tài khoản của bạn đã bị vô hiệu hóa", HTTP_STATUS.FORBIDDEN);
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new AppError(MESSAGE.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  const payload = { id: user._id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await userRepository.updateRefreshToken(user._id, refreshToken);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
    },
  };
};

const logout = async (userId) => {
  await userRepository.updateRefreshToken(userId, null);
};

const refreshToken = async (token) => {
  if (!token) {
    throw new AppError(MESSAGE.REFRESH_TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new AppError(MESSAGE.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
  }

  const user = await userRepository.findByRefreshToken(token);
  if (!user) {
    throw new AppError(MESSAGE.REFRESH_TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
  }

  const payload = { id: user._id, email: user.email, role: user.role };
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  await userRepository.updateRefreshToken(user._id, newRefreshToken);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const getMe = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError(MESSAGE.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  return user;
};

module.exports = { register, login, logout, refreshToken, getMe };
