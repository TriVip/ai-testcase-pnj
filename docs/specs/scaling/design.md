# Scaling & Shared State — Design

Phân tích state per-instance và hướng scale ngang, tổng hợp từ `SCALING_SHARED_STATE.md` (F14). Trạng thái: documentation only.

## 1. State per-instance KHÔNG chia sẻ

Mỗi mục dưới đây sống trong heap của một Node.js process. Chạy nhiều instance (PM2 cluster, nhiều container, autoscaling) gây hành vi mô tả.

### Rate limiter — `middleware/rateLimit.js` (F6)
- `Map` in-memory key theo identity + endpoint path.
- Mỗi instance giữ counters riêng → **effective limit = `max * instanceCount`**.
- Counters reset khi restart, expire theo window cấu hình.

### Script store — `services/scriptStore.js` (F5)
- `Map` in-memory key theo `scriptId`, TTL 30 phút mỗi entry.
- `POST /automation/generate` lưu script trên instance xử lý nó; `POST /automation/run` route tới instance khác sẽ **không tìm thấy `scriptId`**.
- Mất khi restart.

### Runner concurrency semaphore — `services/playwrightRunner.js` (F7)
- Semaphore per-process (`MAX_CONCURRENT_RUNS`, hiện `2`) gate số container Playwright spawn cùng lúc.
- Limit per-process → **tổng host concurrency = `MAX_CONCURRENT_RUNS * instanceCount`**; không có bound cross-instance/global.

### Socket.io real-time events — `server.js`
- Một `Server` với room (`joinRoom`/`leaveRoom`), `req.io` inject vào route để emit event.
- **Không shared adapter** → event emit từ instance này không tới client kết nối instance khác.

## 2. Giả định vận hành an toàn hiện tại

Ứng dụng đúng **khi chạy một backend instance (single process)**. Sticky sessions không giải quyết trọn vẹn (generate→run và Socket.io delivery vẫn hỏng khi instance khác nhau; limit/concurrency vẫn fragment). Cho tới khi có shared state: deploy backend single instance.

## 3. Hướng scale ngang (chưa triển khai)

Cần thêm dependency + chạy Redis, deferred & duyệt riêng:
- **Redis-backed rate limiting** — counters shared global thay vì `max * instanceCount`.
- **Shared script store** — script trong Redis + TTL để generate/run xử lý bởi instance bất kỳ.
- **Socket.io Redis adapter** (`@socket.io/redis-adapter`) — event cross-instance.
- **Cross-instance concurrency limit** — Redis queue/lock (hoặc job queue) nếu cần bound global.

## 4. Cross-references (inline trong code, từ tài liệu gốc)

| Finding | File | Ghi chú inline |
| --- | --- | --- |
| F5 | `services/scriptStore.js` | "SCALING CAVEAT (ties into F14)" — Map in-memory, miss cross-instance, mất khi restart |
| F6 | `middleware/rateLimit.js` | "SCALING CAVEAT (F14)" — counters per-process, effective `max * numberOfInstances` |
| F7 | `services/playwrightRunner.js` | "SCALING CAVEAT (ties into F14)" — semaphore per-process, total `MAX_CONCURRENT_RUNS * instanceCount` |
| Socket.io | `server.js` | Một `Server` với room, không shared adapter — event không cross instance |

Liên quan: module [automation-runner](../automation-runner/requirements.md) (script store, semaphore) và [test-plans](../test-plans/design.md) (Socket.io real-time).

## Nguồn

- [SCALING_SHARED_STATE.md](_source/SCALING_SHARED_STATE.md)
