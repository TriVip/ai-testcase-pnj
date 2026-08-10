# Deployment — Design

Kiến trúc deployment và cấu hình, tổng hợp từ `DEPLOYMENT.md`.

## Kiến trúc (Docker Compose trên VM)

```
Browser
  │  HTTPS (hoặc HTTP)
  ▼
nginx trên host (systemd, port 80/443)  ─┐  OPTIONAL nhưng khuyến nghị mạnh
  │  proxy_pass                           │
  ▼                                       │
frontend container (nginx, port 8080)  ───┘
  │  proxy_pass /api/, /socket.io/
  ▼
backend container (Node/Express, port 9999)
  │
  ▼
MongoDB (Atlas hoặc self-hosted — không thuộc compose file)
```

`docker-compose.yml` chỉ định nghĩa `backend` và `frontend`. MongoDB là external.

## Vì sao cần reverse proxy host-level

nginx của frontend container (từ `frontend/Dockerfile`) chạy unprivileged, không bind được 80/443 — nghe 8080. Hai lựa chọn cổng public:
1. **Publish 8080 trực tiếp** (`ports: ["8080:8080"]`) — đơn giản nhất, không có điểm terminate TLS.
2. **Đặt host-level nginx trước ở 80/443**, proxy tới 8080 (và 9999 cho `/api/` + `/socket.io/`, hoặc chỉ tới 8080 để nginx container tự re-proxy). Đây là cách terminate TLS bằng domain + Let's Encrypt, khuyến nghị cho mọi thứ ngoài local test.

Với option 2: dùng `sudo certbot --nginx` để provision cert và tự thêm `listen 443 ssl` + redirect HTTP→HTTPS. Sau đó chỉ cần 443 reachable public (giữ 80 mở cho renewal + redirect). Header cần forward gồm `X-Forwarded-Proto $scheme` (backend đọc qua `trust proxy`). Server block mẫu đầy đủ có trong tài liệu gốc.

## Biến môi trường

| Variable | Bắt buộc | Ghi chú |
|---|---|---|
| `MONGODB_URI` | Có | Connection string đầy đủ, kèm credentials |
| `JWT_SECRET` | Có | ≥32 ký tự ngẫu nhiên; backend từ chối khởi động nếu thiếu (`openssl rand -base64 48`); xoay → sign out mọi phiên |
| `FRONTEND_URL` | Có | Origin chính xác trình duyệt dùng, không trailing slash/path; origin CORS duy nhất; compose từ chối chạy nếu thiếu |
| `COOKIE_SECURE` | Không | Bỏ trống cho HTTPS (mặc định `Secure; SameSite=None`); `false` chỉ cho same-origin HTTP thuần |
| `OPENAI_API_KEY` | Không | Chỉ cần cho AI features; thiếu thì endpoint AI fail, phần khác chạy bình thường |
| `PORT` | Không | Backend port trong container, mặc định `9999` |
| `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY` | Không | Chỉ liên quan nếu mount `routes/jira.js` (hiện comment) |

`.env.example` document tất cả với placeholder — `cp .env.example .env` và điền giá trị thật, không commit kết quả.

## Standard deploy

```bash
git pull
docker compose up -d --build
```

`env_file:`/`environment:` đọc lúc **container creation**, không live — sau khi đổi `.env`, cần `docker compose up -d` (không `restart`). `docker compose down && docker compose up -d` để recreate sạch khi không chắc.

## Docker build reproducibility (từ ARCHITECTURE.md — Known gaps)

Build dùng `context: ./backend` / `./frontend`, nên root `package-lock.json` nằm ngoài cả hai context; Dockerfile không dùng được `npm ci`, fallback `npm install` (re-resolve trong semver range).

## Nguồn

- [DEPLOYMENT.md](_source/DEPLOYMENT.md)
- [QUICKSTART.md](_source/QUICKSTART.md)
- [ARCHITECTURE.md — Known gaps (Docker builds)](../platform-overview/_source/ARCHITECTURE.md)
