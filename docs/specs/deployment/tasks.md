# Deployment — Tasks

Hạng mục vận hành có thật trong tài liệu gốc (QUICKSTART chạy local, DEPLOYMENT deploy VM + troubleshooting).

## Chạy local (từ QUICKSTART.md)

- [ ] `cp .env.example .env`, điền `MONGODB_URI` và `JWT_SECRET` (≥32 ký tự, `openssl rand -base64 48`).
- [ ] (Tuỳ chọn) Thêm `OPENAI_API_KEY` để dùng AI suggestions.
- [ ] `npm run dev` — Frontend :5173, Backend :9999.
- [ ] Đăng ký tài khoản (password ≥ 8 ký tự) → tạo test cases → test plans → export XLSX.

## Deploy VM (từ DEPLOYMENT.md)

- [ ] Chuẩn bị host; (khuyến nghị) đặt host-level nginx 80/443 proxy tới container 8080 / backend 9999.
- [ ] Set `.env` ở repo root: `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL` (bắt buộc); tuỳ chọn `COOKIE_SECURE`, `OPENAI_API_KEY`, `PORT`, `JIRA_*`.
- [ ] `git pull && docker compose up -d --build`.
- [ ] `sudo certbot --nginx` để cấp TLS cert (nếu dùng reverse proxy host-level).
- [ ] Verify: `docker compose ps`, logs backend có "MongoDB Connected", `curl :9999/health` = OK, `curl :8080/` = 200.
- [ ] Test end-to-end trên trình duyệt: đăng ký → refresh → vẫn đăng nhập.

## Xoay secrets (từ DEPLOYMENT.md — Rotating secrets)

- [ ] `JWT_SECRET`: sinh mới, cập nhật `.env`, `docker compose up -d` (mọi phiên bị invalidate).
- [ ] `OPENAI_API_KEY`: revoke key cũ ở platform.openai.com *trước*, rồi thay trong `.env`.
- [ ] MongoDB credentials: xoay qua Atlas (tạo user mới → cập nhật URI → verify → xoá user cũ).

## Troubleshooting đã ghi nhận (từ DEPLOYMENT.md)

- [ ] `unknown shorthand flag: 'd'` → cài Docker Compose V2 plugin.
- [ ] `compose build requires buildx 0.17.0` → `COMPOSE_BAKE=false` hoặc nâng cấp buildx.
- [ ] Backend log `FATAL: JWT_SECRET ...` → set `JWT_SECRET` thật.
- [ ] Compose từ chối vì `FRONTEND_URL` → set biến này.
- [ ] Login 200 nhưng request kế tiếp như đã logout → cookie `Secure` trên HTTP thuần; dùng TLS hoặc `COOKIE_SECURE=false` (chỉ HTTP test).
- [ ] CORS error → `FRONTEND_URL` không khớp origin (port/scheme/trailing slash).
- [ ] MongoDB timeout sau khi restart VM → public IP đổi; thêm IP hiện tại vào Atlas Network Access; kiểm tra cluster không bị pause.
- [ ] Bare IP serve app lạ → kiểm tra host-level web server độc lập (`sudo ss -tlnp`).

## Nguồn

- [QUICKSTART.md](_source/QUICKSTART.md)
- [DEPLOYMENT.md](_source/DEPLOYMENT.md)
