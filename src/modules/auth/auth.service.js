const userRepository = require("../users/user.repository");
const otpRepository = require("../otp/otp.repository");
const { hashPassword, comparePassword } = require("../../core/utils/hash");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../../core/utils/token");
const { generateOtp, getOtpExpiry, isResendTooSoon, getResendWaitSeconds, OTP_EXPIRES_MINUTES } = require("../../core/utils/otp");
const { sendOtpEmail } = require("../../core/utils/email");
const MESSAGE = require("../../core/constants/message");
const HTTP_STATUS = require("../../core/constants/status");
const ACCOUNT_TYPE = require("../../core/constants/accountType");
const OTP_TYPE = require("../../core/constants/otpType");

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const _issueTokens = async (user) => {
  const payload = { id: user._id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  await userRepository.updateRefreshToken(user._id, refreshToken);
  return { accessToken, refreshToken };
};

const _formatUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  type: user.type,
  phone: user.phone,
  avatar: user.avatar,
});

const _createAndSendOtp = async ({ email, fullName, type }) => {
  const existingOtp = await otpRepository.findLatestActiveByEmailAndType(email, type);

  if (existingOtp && isResendTooSoon(existingOtp.createdAt)) {
    const waitSeconds = getResendWaitSeconds(existingOtp.createdAt);
    throw new AppError(`${MESSAGE.OTP_RESEND_TOO_SOON} (còn ${waitSeconds}s)`, 429);
  }

  const otp = generateOtp();
  const expiresAt = getOtpExpiry();

  await otpRepository.create({ email, otp, type, expiresAt });
  await sendOtpEmail({ to: email, fullName, otp, expiresInMinutes: OTP_EXPIRES_MINUTES });
};

// ─── REGISTER ───

const register = async ({ fullName, email, password, role, phone }) => {
  const existingUser = await userRepository.findByEmail(email);

  if (existingUser) {
    if (existingUser.isVerified) {
      throw new AppError(MESSAGE.EMAIL_ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
    }
    // Email đã đăng ký nhưng chưa xác thực → gửi lại OTP (cooldown được kiểm tra trong _createAndSendOtp)
    await _createAndSendOtp({ email, fullName: existingUser.fullName, type: OTP_TYPE.REGISTER });
    return { email };
  }

  const hashedPassword = await hashPassword(password);
  const user = await userRepository.create({
    fullName,
    email,
    password: hashedPassword,
    role,
    phone,
    type: ACCOUNT_TYPE.LOCAL,
    isVerified: false,
  });

  await _createAndSendOtp({ email, fullName, type: OTP_TYPE.REGISTER });

  return { email: user.email };
};

// ─── VERIFY OTP ───

const verifyOtp = async ({ email, otp, type = OTP_TYPE.REGISTER }) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new AppError(MESSAGE.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  if (type === OTP_TYPE.REGISTER && user.isVerified) {
    throw new AppError(MESSAGE.OTP_ALREADY_VERIFIED, HTTP_STATUS.CONFLICT);
  }

  // findLatestActiveByEmailAndType đã lọc expiresAt > now nên không cần kiểm tra thêm
  const otpDoc = await otpRepository.findLatestActiveByEmailAndType(email, type);
  if (!otpDoc) {
    throw new AppError(MESSAGE.OTP_EXPIRED, HTTP_STATUS.BAD_REQUEST);
  }

  if (otpDoc.otp !== otp) {
    throw new AppError(MESSAGE.OTP_INVALID, HTTP_STATUS.BAD_REQUEST);
  }

  // OTP hợp lệ → xóa khỏi collection
  await otpRepository.deleteByEmailAndType(email, type);

  if (type === OTP_TYPE.REGISTER) {
    const verifiedUser = await userRepository.verifyUser(user._id);
    const { accessToken, refreshToken } = await _issueTokens(verifiedUser);
    return { accessToken, refreshToken, user: _formatUser(verifiedUser) };
  }

  // Với forgot_password: chỉ trả về xác nhận, việc đổi mật khẩu xử lý ở bước tiếp theo
  return { email };
};

// ─── RESEND OTP ───────────────────────────────────────────────────────────────

const resendOtp = async ({ email, type = OTP_TYPE.REGISTER }) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new AppError(MESSAGE.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  if (type === OTP_TYPE.REGISTER && user.isVerified) {
    throw new AppError(MESSAGE.OTP_ALREADY_VERIFIED, HTTP_STATUS.CONFLICT);
  }

  await _createAndSendOtp({ email, fullName: user.fullName, type });

  return { email };
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────

const login = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email, true);
  if (!user) {
    throw new AppError(MESSAGE.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  if (!user.isVerified) {
    throw new AppError(MESSAGE.EMAIL_NOT_VERIFIED, HTTP_STATUS.FORBIDDEN);
  }

  if (!user.isActive) {
    throw new AppError("Tài khoản của bạn đã bị vô hiệu hóa", HTTP_STATUS.FORBIDDEN);
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new AppError(MESSAGE.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  const { accessToken, refreshToken } = await _issueTokens(user);
  return { accessToken, refreshToken, user: _formatUser(user) };
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

const logout = async (userId) => {
  await userRepository.updateRefreshToken(userId, null);
};

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────

const refreshToken = async (token) => {
  if (!token) {
    throw new AppError(MESSAGE.REFRESH_TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
  }

  try {
    verifyRefreshToken(token);
  } catch {
    throw new AppError(MESSAGE.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
  }

  const user = await userRepository.findByRefreshToken(token);
  if (!user) {
    throw new AppError(MESSAGE.REFRESH_TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
  }

  const { accessToken, refreshToken: newRefreshToken } = await _issueTokens(user);
  return { accessToken, refreshToken: newRefreshToken };
};

// ─── GET USER INFO ────────────────────────────────────────────────────────────

const getUserInfo = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError(MESSAGE.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  return user;
};

module.exports = { register, verifyOtp, resendOtp, login, logout, refreshToken, getUserInfo };
