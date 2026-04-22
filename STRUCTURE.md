# Cấu trúc thư mục — Backend (WebTutorCenter_Client_BE)

> **Stack:** Node.js · Express · MongoDB · Mongoose · JWT · Nodemailer · Google Auth Library · Joi · bcryptjs

---

## Tổng quan

```
WebTutorCenter_Client_BE/
├── server.js                     # Entry point: load .env, kết nối DB, khởi động server
├── app.js                        # Cấu hình Express: CORS, middleware, routes, error handler
│
├── src/
│   ├── routes/
│   │   └── index.js              # Gom tất cả module routes vào tiền tố /api
│   │
│   ├── core/                     # Hạ tầng dùng chung toàn app
│   │   ├── configs/
│   │   │   └── database.js       # Kết nối MongoDB với Mongoose
│   │   │
│   │   ├── constants/            # Hằng số toàn app
│   │   │   ├── accountType.js    # local | google
│   │   │   ├── message.js        # Tất cả message trả về cho client
│   │   │   ├── otpType.js        # register | forgot_password
│   │   │   ├── role.js           # user | tutor | admin
│   │   │   └── status.js         # HTTP status codes (200, 201, 400, 401...)
│   │   │
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js    # Xác thực JWT: gắn req.user vào request
│   │   │   ├── error.middleware.js   # Xử lý lỗi hệ thống (5xx) — lỗi không mong đợi
│   │   │   └── role.middleware.js    # Phân quyền theo role
│   │   │
│   │   └── utils/
│   │       ├── AppError.js       # Class lỗi người dùng (isUserError: true) — trả JSON trực tiếp
│   │       ├── email.js          # Gửi email OTP qua Nodemailer/Gmail
│   │       ├── hash.js           # hashPassword() / comparePassword() — bcryptjs
│   │       ├── otp.js            # generateOtp(), getOtpExpiry(), kiểm tra cooldown gửi lại
│   │       ├── response.js       # successResponse() — chuẩn hoá response thành công
│   │       └── token.js          # generateAccessToken/RefreshToken/ResetToken, verify...
│   │
│   └── modules/                  # Tổ chức theo domain (module-based)
│       ├── auth/
│       │   ├── auth.controller.js    # Nhận request, gọi service, trả response
│       │   ├── auth.routes.js        # Định nghĩa routes của module auth
│       │   ├── auth.service.js       # Logic nghiệp vụ xác thực
│       │   └── auth.validation.js    # Joi schemas validate request body
│       │
│       ├── otp/
│       │   ├── otp.model.js          # Schema MongoDB: email, otp, type, expiresAt
│       │   └── otp.repository.js     # Truy vấn DB cho OTP
│       │
│       └── users/
│           ├── user.model.js         # Schema MongoDB: fullName, email, password, role...
│           └── user.repository.js    # Truy vấn DB cho User
│
├── .env                          # Biến môi trường (xem bên dưới)
└── package.json
```

---

## Biến môi trường `.env`

| Biến | Mô tả |
|---|---|
| `PORT` | Port server (mặc định 5002) |
| `NODE_ENV` | `development` hoặc `production` |
| `MONGODB_URI` | Chuỗi kết nối MongoDB |
| `ACCESS_TOKEN_SECRET` | Secret ký JWT access token |
| `ACCESS_TOKEN_EXPIRES_IN` | Thời hạn access token (vd: `15m`) |
| `REFRESH_TOKEN_SECRET` | Secret ký JWT refresh token |
| `REFRESH_TOKEN_EXPIRES_IN` | Thời hạn refresh token (vd: `7d`) |
| `GMAIL_USER` | Địa chỉ Gmail gửi OTP |
| `GMAIL_PASS` | App password Gmail |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `CLIENT_URL` | URL frontend (CORS origin) |

---

## API Routes

**Base:** `http://localhost:5002/api`

### Auth — `/api/auth`

| Method | Endpoint | Middleware | Mô tả |
|---|---|---|---|
| POST | `/register` | validate | Đăng ký tài khoản, gửi OTP email |
| POST | `/verify-otp` | validate | Xác thực OTP kích hoạt tài khoản |
| POST | `/resend-otp` | validate | Gửi lại OTP xác thực |
| POST | `/google` | — | Đăng nhập bằng Google (ID token) |
| POST | `/login` | validate | Đăng nhập email/mật khẩu |
| POST | `/logout` | authMiddleware | Đăng xuất, xoá refresh token |
| POST | `/refresh-token` | — | Cấp lại access token từ cookie |
| POST | `/forgot-password` | validate | Gửi OTP quên mật khẩu |
| POST | `/verify-forgot-password-otp` | validate | Xác thực OTP quên mật khẩu |
| POST | `/reset-password` | validate | Đặt lại mật khẩu mới |
| GET | `/user-info` | authMiddleware | Lấy thông tin người dùng hiện tại |

---

## Luồng xử lý request

```
Request
  └── Express Router (app.js)
        └── Middleware (CORS, JSON parser, Cookie parser)
              └── routes/index.js  →  /api/auth/*
                    └── auth.middleware.js  (nếu route cần xác thực)
                          └── auth.validation.js  (validate request body với Joi)
                                └── auth.controller.js
                                      └── auth.service.js  (logic nghiệp vụ)
                                            └── user.repository.js / otp.repository.js
                                                  └── MongoDB (Mongoose)
```

### Phân loại lỗi

| Loại lỗi | Xử lý | Ví dụ |
|---|---|---|
| **Lỗi người dùng** (`AppError`) | Controller bắt → trả JSON `{ success: false, message }` trực tiếp | Sai mật khẩu, OTP hết hạn, email đã tồn tại |
| **Lỗi hệ thống** (Error thường) | `next(error)` → `error.middleware.js` → log + trả 500 | DB crash, lỗi không mong đợi |

---

## Cấu trúc mỗi module

```
modules/<tên-module>/
├── <module>.controller.js    # Nhận req/res, gọi service, trả response
├── <module>.routes.js        # Định nghĩa routes, gắn middleware + controller
├── <module>.service.js       # Logic nghiệp vụ, throw AppError khi có lỗi người dùng
├── <module>.validation.js    # Joi schemas để validate request body
├── <module>.model.js         # Mongoose schema (nếu có collection riêng)
└── <module>.repository.js    # Các hàm truy vấn MongoDB (findBy..., create, update...)
```

## Thêm module mới

1. Tạo thư mục `src/modules/<tên>/` theo cấu trúc trên
2. Đăng ký routes trong `src/routes/index.js`
3. Thêm constants cần thiết vào `src/core/constants/`
4. Dùng `AppError` cho lỗi nghiệp vụ, không dùng `throw new Error()` thông thường
5. Dùng `successResponse()` để trả response thành công
