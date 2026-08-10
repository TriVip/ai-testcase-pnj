# Test Plans — Design

Thiết kế kỹ thuật cho test plan, trọng tâm là lớp real-time (Socket.io), tổng hợp từ `ARCHITECTURE.md`.

## Real-time updates (Socket.io)

- Socket handshake được xác thực bằng cùng JWT với REST API (đọc từ cookie `token`, hoặc `socket.handshake.auth.token` cho client không dùng cookie).
- Room được key theo test plan id. `joinRoom` kiểm tra cùng quy tắc phân quyền như REST API (chủ plan, hoặc thành viên workspace của plan) trước khi cho join — client ẩn danh hoặc không có quyền không thể subscribe plan của người khác.
- Sự kiện: `testCaseStatusUpdated`, phát bởi `PUT /api/testcases/:id` khi `executionStatus` đổi, broadcast tới mọi test plan room chứa test case đó. Trang Test Plans của frontend join room của plan đang mở và live-update trạng thái hiển thị mà không refetch.

## Rollup cấp plan

`executionStatus`/`executionNotes` ở cấp plan là rollup tách biệt với `executionStatus` của từng test case. Điều này cho phép đánh giá cả một chu kỳ test là Pass/Failed/Pending nói chung, độc lập với từng test case (xem USER_GUIDE mục 4).

## Cân nhắc scaling (từ SCALING_SHARED_STATE.md)

Socket.io hiện dùng một `Server` instance với room, **không có shared adapter**, nên sự kiện phát từ instance này không tới client kết nối instance khác. Ứng dụng chỉ đúng khi chạy **một backend instance**. Chi tiết và hướng khắc phục: xem module [scaling](../scaling/requirements.md).

## Nguồn

- [ARCHITECTURE.md — Real-time updates (Socket.io)](../platform-overview/_source/ARCHITECTURE.md)
- [SCALING_SHARED_STATE.md — Socket.io real-time events](../scaling/_source/SCALING_SHARED_STATE.md)
