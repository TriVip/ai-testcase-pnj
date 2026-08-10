# Scaling & Shared State — Requirements

Module ghi nhận state per-process/in-memory không chia sẻ giữa các backend instance, giả định vận hành an toàn hiện tại, và hướng scale ngang. Tổng hợp từ SCALING_SHARED_STATE.md (F14).

Trạng thái gốc: **Documentation only** — F14 không thêm Redis, không thêm dependency, không đổi `docker-compose`. Mọi chuyển sang shared state cần thêm dependency + chạy Redis, **deferred và phải duyệt riêng**.

## User Stories & Acceptance Criteria

### US-1: Là người vận hành, tôi phải biết state nào không chia sẻ giữa các instance.

- WHERE rate limiter (`middleware/rateLimit.js`, F6) THE SYSTEM SHALL giữ counters in-memory per-process → **effective limit = `max * instanceCount`**; counters reset khi restart.
- WHERE script store (`services/scriptStore.js`, F5) THE SYSTEM SHALL giữ Map in-memory key theo `scriptId`, TTL 30 phút → `generate` và `run` ở hai instance khác nhau sẽ miss `scriptId`; mất khi restart.
- WHERE runner concurrency semaphore (`services/playwrightRunner.js`, F7) THE SYSTEM SHALL là semaphore per-process (`MAX_CONCURRENT_RUNS`, hiện `2`) → tổng host concurrency = `MAX_CONCURRENT_RUNS * instanceCount`; không có bound cross-instance.
- WHERE Socket.io (`server.js`) THE SYSTEM SHALL là một `Server` với room nhưng **không có shared adapter** → event phát từ instance này không tới client kết nối instance khác.

### US-2: Là người vận hành, tôi phải biết giả định vận hành an toàn hiện tại.

- WHEN ứng dụng chạy THE SYSTEM SHALL chỉ đảm bảo đúng khi chạy **một backend instance (single process)**.
- WHEN dùng sticky sessions THE SYSTEM SHALL vẫn KHÔNG giải quyết trọn vẹn: luồng generate→run và Socket.io event delivery vẫn hỏng khi request liên quan hoặc instance phát khác instance client pin; limit/concurrency vẫn fragment per-process.

### US-3: Là người vận hành, tôi muốn biết hướng scale ngang (chưa triển khai).

- WHEN muốn scale nhiều instance THE SYSTEM SHALL (khi được duyệt) cần: rate limiting backed bởi Redis; shared script store (Redis + TTL); Socket.io Redis adapter (`@socket.io/redis-adapter`); cross-instance concurrency limit (Redis queue/lock hoặc job queue).
- WHERE các thay đổi trên THE SYSTEM SHALL đều thêm runtime dependency Redis + npm packages → out of scope cho bản fix F14 tối thiểu.

## Nguồn

- [SCALING_SHARED_STATE.md](_source/SCALING_SHARED_STATE.md)
