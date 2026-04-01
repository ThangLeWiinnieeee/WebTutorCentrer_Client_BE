const MESSAGE = {
  // Auth
  REGISTER_SUCCESS: "Đăng ký thành công",
  LOGIN_SUCCESS: "Đăng nhập thành công",
  LOGOUT_SUCCESS: "Đăng xuất thành công",
  REFRESH_TOKEN_SUCCESS: "Làm mới token thành công",

  // User
  USER_NOT_FOUND: "Không tìm thấy người dùng",
  EMAIL_ALREADY_EXISTS: "Email đã được sử dụng",
  INVALID_CREDENTIALS: "Email hoặc mật khẩu không đúng",
  PASSWORD_MISMATCH: "Mật khẩu xác nhận không khớp",

  // Token
  TOKEN_MISSING: "Không tìm thấy token xác thực",
  TOKEN_INVALID: "Token không hợp lệ hoặc đã hết hạn",
  TOKEN_EXPIRED: "Token đã hết hạn",
  REFRESH_TOKEN_INVALID: "Refresh token không hợp lệ",

  // Validation
  VALIDATION_ERROR: "Dữ liệu đầu vào không hợp lệ",

  // Server
  INTERNAL_SERVER_ERROR: "Lỗi máy chủ nội bộ",
  FORBIDDEN: "Bạn không có quyền thực hiện hành động này",
};

module.exports = MESSAGE;
