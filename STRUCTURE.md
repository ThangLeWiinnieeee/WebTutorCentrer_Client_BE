# Cấu trúc thư mục — Backend (WebTutorCenter_BE)

> **Stack:** Node.js · Express · MongoDB · Mongoose · JWT · Nodemailer · Google Auth Library · Joi · bcryptjs · Cloudinary · Multer (multer-storage-cloudinary) · morgan · cookie-parser

---

## Tổng quan

```
WebTutorCenter_BE/
├── server.js                     # Entry: dotenv, connectDB, app.listen; PORT mặc định 5000 (nếu không set)
├── app.js                        # Express: CORS (theo CLIENT_URL, mặc định http://localhost:3000), morgan, json/urlencoded, cookieParser, /api, error handler
│
├── src/
│   ├── routes/
│   │   └── index.js              # Gom module routes: /api/auth, /api/users
│   │
│   ├── core/                     # Hạ tầng dùng chung toàn app
│   │   ├── configs/
│   │   │   ├── database.js       # Kết nối MongoDB với Mongoose
│   │   │   └── cloudinary.js     # Cấu hình cloudinary (CLOUDINARY_*), export instance dùng upload
│   │   │
│   │   ├── constants/            # Hằng số dùng chung nhiều module
│   │   │   ├── accountType.js    # local | google
│   │   │   ├── message.js        # Tất cả message trả về cho client
│   │   │   ├── otpType.js        # register | forgot_password
│   │   │   ├── role.js           # user | tutor | admin
│   │   │   └── status.js         # HTTP status codes (200, 201, 400, 401...)
│   │   │   # Lưu ý: constants chỉ phục vụ 1 module → đặt trong module đó (vd: src/modules/tutors/constants/)
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
│   │       ├── token.js          # generateAccessToken/RefreshToken/ResetToken, verify...
│   │       └── upload.js         # uploadAvatarMiddleware (multer + Cloudinary storage), deleteAvatarFromCloudinary
│   │
│   └── modules/                  # Tổ chức theo domain (module-based)
│       ├── auth/
│       │   ├── auth.controller.js    # Đăng ký, OTP, login Google/local, refresh/logout, quên mật khẩu
│       │   ├── auth.routes.js        # Chỉ routes xác thực (/register … /reset-password, /login, /google, v.v.)
│       │   ├── auth.service.js       # Logic xác thực (token, OTP, Google, mật khẩu); gọi user.repository
│       │   └── auth.validation.js    # Joi cho register, login, OTP, forgot/reset password (không còn updateProfile)
│       │
│       ├── otp/
│       │   ├── otp.model.js          # Schema MongoDB: email, otp, type, expiresAt
│       │   └── otp.repository.js     # Truy vấn DB cho OTP
│       │
│       ├── users/
│       │   ├── user.model.js         # Schema User (fullName, email, role, type, phone, gender, dateOfBirth, avatar, …)
│       │   ├── user.repository.js    # findByEmail, findById, updateProfile, … — auth.service + user.service gọi
│       │   ├── user.controller.js    # getUserInfo, uploadAvatar, updateProfile
│       │   ├── user.service.js       # Thông tin hồ sơ, cập nhật profile, upload avatar (xóa ảnh cũ Cloudinary)
│       │   ├── user.validation.js    # Joi: updateProfile (body PATCH /update-profile)
│       │   └── user.routes.js        # Mount tại /api/users — /user-info, /upload-avatar, /update-profile
│       │
│       └── tutors/
│           ├── constants/             # Hằng số riêng module tutor
│           │   ├── index.js           # Re-export tất cả
│           │   ├── subject.js         # Danh sách môn học
│           │   ├── area.js            # Danh sách tỉnh/thành VN
│           │   ├── occupationStatus.js # student | graduated | teacher
│           │   └── tutor.js           # TUTOR_STATUS, DAYS_OF_WEEK, PHONE_REGEX, TIME_REGEX
│           ├── tutor.controller.js
│           ├── tutor.model.js         # Schema Tutor + pre('save')/pre('findOneAndUpdate') validate rejectionReason
│           ├── tutor.repository.js
│           ├── tutor.routes.js
│           ├── tutor.service.js
│           └── tutor.validation.js    # Joi schema cho registerTutor (gồm availability)
│
├── .env                          # Biến môi trường (xem bên dưới)
├── package.json
└── STRUCTURE.md
```

---

## Biến môi trường `.env`

| Biến | Mô tả |
|---|---|
| `PORT` | Port server (mặc định `5000` trong `server.js` nếu không khai báo) |
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
| `CLOUDINARY_CLOUD_NAME` | Tên cloud Cloudinary |
| `CLOUDINARY_API_KEY` | API key Cloudinary |
| `CLOUDINARY_API_SECRET` | API secret Cloudinary |

---

## API Routes

**Base:** `http://localhost:<PORT>/api` (ví dụ: `http://localhost:5002/api` nếu bạn set `PORT=5002` trong `.env`)

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

### Users (hồ sơ) — `/api/users`

Các route dưới đây yêu cầu **JWT hợp lệ** (`Authorization: Bearer ...`); `authMiddleware` gắn `req.user`.

| Method | Endpoint | Middleware | Mô tả |
|---|---|---|---|
| GET | `/user-info` | authMiddleware | Lấy thông tin user hiện tại (đã format) |
| PATCH | `/update-profile` | authMiddleware, validate (Joi) | Cập nhật hồ sơ: fullName, phone, gender, dateOfBirth |
| POST | `/upload-avatar` | authMiddleware, uploadAvatarMiddleware (multer → Cloudinary) | Tải ảnh đại diện (field `avatar`), cập nhật URL, xóa ảnh cũ trên Cloudinary nếu có |

---

## Luồng xử lý request

```
Request
  └── Express Router (app.js)
        └── Middleware (CORS, JSON parser, Cookie parser, morgan)
              └── routes/index.js
                    ├── /api/auth/*
                    │     ├── auth.validation.js  (Joi, nếu route khai báo)
                    │     ├── auth.middleware.js  (logout: JWT)
                    │     └── auth.controller.js
                    │           └── auth.service.js
                    │                 └── user.repository.js / otp.repository.js
                    │
                    └── /api/users/*
                          ├── user.validation.js  (Joi: update-profile)
                          ├── upload.js  (upload-avatar: multer + Cloudinary)
                          ├── auth.middleware.js  (mọi route: JWT → req.user)
                          └── user.controller.js
                                └── user.service.js
                                      └── user.repository.js
                                            └── MongoDB (Mongoose)
```

### Phân loại lỗi

| Loại lỗi | Xử lý | Ví dụ |
|---|---|---|
| **Lỗi người dùng** (`AppError`) | Controller bắt → trả JSON `{ success: false, message }` trực tiếp | Sai mật khẩu, OTP hết hạn, email đã tồn tại, sai loại file ảnh |
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
3. Constants:
   - Dùng chung nhiều module → `src/core/constants/`
   - Chỉ dùng trong 1 module → `src/modules/<tên>/constants/` (ưu tiên giảm coupling)
4. Dùng `AppError` cho lỗi nghiệp vụ, không dùng `throw new Error()` thông thường
5. Dùng `successResponse()` để trả response thành công
