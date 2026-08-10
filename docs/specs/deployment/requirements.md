# Deployment — Requirements

Module deploy ứng dụng: chạy local (QUICKSTART) và deploy thật lên VM bằng Docker Compose (DEPLOYMENT). Tổng hợp từ DEPLOYMENT.md và QUICKSTART.md.

## User Stories & Acceptance Criteria

### US-1: Là lập trình viên, tôi muốn chạy ứng dụng ở local nhanh chóng.

- WHEN thiết lập local THE SYSTEM SHALL yêu cầu tạo `.env` từ `.env.example` (`cp .env.example .env`) và điền `MONGODB_URI` cùng `JWT_SECRET`.
- WHEN `JWT_SECRET` trống, ngắn hơn 32 ký tự, hoặc là placeholder đã biết THE SYSTEM SHALL từ chối khởi động server (sinh giá trị bằng `openssl rand -base64 48`).
- WHEN chạy `npm run dev` THE SYSTEM SHALL chạy Frontend tại http://localhost:5173 và Backend tại http://localhost:9999.
- WHEN không có `OPENAI_API_KEY` THE SYSTEM SHALL vẫn dùng được mọi tính năng khác, chỉ AI suggestions không hoạt động.
- WHEN người dùng đăng ký với mật khẩu ≥ 8 ký tự THE SYSTEM SHALL tạo tài khoản và tự động đăng nhập, chuyển tới Dashboard.

### US-2: Là người vận hành, tôi muốn deploy lên VM bằng Docker Compose.

- WHEN deploy THE SYSTEM SHALL dùng `docker-compose.yml` định nghĩa hai service `backend` và `frontend`; MongoDB là external (Atlas hoặc self-hosted, không nằm trong compose).
- WHEN flow deploy chuẩn THE SYSTEM SHALL là `git pull` rồi `docker compose up -d --build`.
- WHEN `.env` thay đổi THE SYSTEM SHALL yêu cầu `docker compose up -d` (không phải `restart`) để container đọc giá trị mới lúc tạo container.

### US-3: Là người vận hành, tôi phải set các biến môi trường bắt buộc.

- WHEN thiếu `MONGODB_URI` THE SYSTEM SHALL không kết nối được DB.
- WHEN thiếu `JWT_SECRET` THE SYSTEM SHALL từ chối khởi động backend (check `JWT_SECRET_PLACEHOLDERS` trong `server.js`).
- WHEN thiếu `FRONTEND_URL` THE SYSTEM SHALL khiến `docker compose` từ chối khởi động (`${FRONTEND_URL:?...}`, không có fallback).
- WHERE `FRONTEND_URL` THE SYSTEM SHALL là origin chính xác trình duyệt dùng (không trailing slash, không path) và là origin CORS duy nhất được chấp nhận.

### US-4: Là người vận hành trên HTTP thuần, tôi muốn cấu hình cookie phù hợp.

- WHEN deployment HTTPS THE SYSTEM SHALL để `COOKIE_SECURE` không set (mặc định `Secure; SameSite=None`).
- WHEN deployment same-origin HTTP thuần (không TLS) THE SYSTEM SHALL cho set `COOKIE_SECURE=false`; không bao giờ set khi có TLS.

### US-5: Là người vận hành, tôi muốn xác minh deploy thành công.

- WHEN kiểm tra THE SYSTEM SHALL cho `docker compose ps` (cả hai "Up"), logs backend có "MongoDB Connected" không có FATAL, `curl http://localhost:9999/health` trả `{"status":"OK","db":"connected"}`, và `curl http://localhost:8080/` trả 200.
- WHEN kiểm tra end-to-end THE SYSTEM SHALL yêu cầu test thực tế trên trình duyệt tại public URL: đăng ký, refresh, xác nhận vẫn đăng nhập (chứng minh cấu hình cookie/CORS/`FRONTEND_URL` đúng).

### US-6: Là người vận hành, tôi muốn xoay secrets an toàn.

- WHEN xoay `JWT_SECRET` THE SYSTEM SHALL invalidate mọi phiên hiện có (đúng, không phải bug).
- WHEN xoay `OPENAI_API_KEY` THE SYSTEM SHALL yêu cầu revoke key cũ ở platform.openai.com *trước*, rồi thay trong `.env`.
- WHEN xoay MongoDB credentials THE SYSTEM SHALL làm qua Atlas (tạo user mới, cập nhật `MONGODB_URI`, verify, xoá user cũ). Chi tiết checklist: xem module [security-secrets](../security-secrets/requirements.md).

## Ghi chú kiến trúc & port (từ DEPLOYMENT.md)

- Reverse proxy host-level (nginx 80/443) là tuỳ chọn nhưng khuyến nghị mạnh; container frontend nginx chạy unprivileged, nghe port 8080.
- `PORT` backend mặc định `9999`; frontend nginx, Vite dev proxy và `docker-compose.yml` đều giả định `9999` — không đổi nếu không cập nhật cả ba.

## Nguồn

- [DEPLOYMENT.md](_source/DEPLOYMENT.md)
- [QUICKSTART.md](_source/QUICKSTART.md)
