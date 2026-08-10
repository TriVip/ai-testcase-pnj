# Logging — Design

Khuyến nghị kỹ thuật cho structured logging, tổng hợp từ `LOGGING_RECOMMENDATION.md` (F26). Trạng thái: Deferred (recommendation only).

## Lựa chọn công nghệ

Adopt một structured logger. [pino](https://github.com/pinojs/pino) phù hợp cho codebase Node/Express này:

- **JSON logs** — output machine-parseable cho aggregation và search.
- **Log levels** — `trace`/`debug`/`info`/`warn`/`error`/`fatal`, điều khiển qua env var (`LOG_LEVEL`).
- **Request logging middleware** — [pino-http](https://github.com/pinojs/pino-http) log mỗi request/response với correlation id, method, path, status, latency.
- **Redaction** — cấu hình pino `redact` để strip secrets/PII (`req.headers.authorization`, `req.headers.cookie`, password/token, API keys).
- **Thay `console.log`/`console.error` rải rác** — route qua một shared logger instance để format và level nhất quán.

## Migration outline (khi được duyệt)

1. Thêm `pino` và `pino-http` làm dependency (cần duyệt theo dependency policy — xem [dependencies](../dependencies/requirements.md)), rồi `npm install`.
2. Tạo shared logger module (ví dụ `backend/src/config/logger.js`) export pino instance với `level` từ `LOG_LEVEL` và danh sách `redact`.
3. Wire `pino-http` vào Express app sớm trong middleware chain ở `server.js`.
4. Thay các call `console.log`/`console.error` bằng shared logger.
5. Ở dev, tuỳ chọn pipe qua `pino-pretty` cho output dễ đọc.

## Ghi chú về OAuth env vars không dùng (từ tài liệu gốc)

`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`GOOGLE_CALLBACK_URL` trong `.env.example` hiện **không dùng** — passport Google OAuth strategy là dead code và đã bị gỡ (F26). Env vars giữ lại để document khả năng OAuth trong tương lai.

## Nguồn

- [LOGGING_RECOMMENDATION.md](_source/LOGGING_RECOMMENDATION.md)
