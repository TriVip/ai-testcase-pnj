# Logging — Tasks

Migration outline có thật trong `LOGGING_RECOMMENDATION.md` (F26). Trạng thái: Deferred — chỉ thực hiện khi được duyệt (cần thêm dependency).

- [ ] Thêm `pino` và `pino-http` làm dependency (cần duyệt theo dependency policy), rồi `npm install`.
- [ ] Tạo shared logger module (ví dụ `backend/src/config/logger.js`) export pino instance với `level` từ `LOG_LEVEL` và danh sách `redact`.
- [ ] Wire `pino-http` vào Express app sớm trong middleware chain ở `server.js`.
- [ ] Thay các call `console.log`/`console.error` bằng shared logger.
- [ ] (Tuỳ chọn, dev) Pipe qua `pino-pretty` cho output dễ đọc.

## Nguồn

- [LOGGING_RECOMMENDATION.md — Migration outline](_source/LOGGING_RECOMMENDATION.md)
