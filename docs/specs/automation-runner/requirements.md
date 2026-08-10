# Automation Runner — Requirements

Module thực thi test tự động (Playwright) trong container cô lập. Tổng hợp từ Feature Specification, RUNNER_EXECUTION_MODEL.md và SCALING_SHARED_STATE.md.

Trạng thái: ⚪ **chưa triển khai** ở nhánh hiện tại. Trang "Automation Testing" chỉ là placeholder; không có backend. Tài liệu `RUNNER_EXECUTION_MODEL.md` được viết cho nhánh Playwright runner **chưa merge** (mô tả `backend/src/services/playwrightRunner.js` và sandbox firewall **không tồn tại** trong repo này) — vì vậy các yêu cầu dưới đây là **mô hình mục tiêu/ràng buộc thiết kế**, chưa phải hành vi đang chạy.

## User Stories & Acceptance Criteria

### US-1: Là người dùng, tôi muốn (khi triển khai) chạy test tự động và nhận báo cáo.

- Feature dự kiến: Playwright integration, sandboxed test execution, generated reports/screenshots.
- WHEN người dùng vào mục Automation Testing hiện tại THE SYSTEM SHALL hiển thị trang giới thiệu "sắp ra mắt" (không phải lỗi, cũng chưa phải feature chạy được).
- > TODO: chưa có trong tài liệu gốc — chi tiết acceptance của luồng chạy test thật (input script, trả report) chưa được đặc tả cho repo hiện tại.

### US-2: Là hệ thống, tôi phải chạy script không tin cậy trong container cô lập, không trong backend.

- WHEN có yêu cầu chạy test THE SYSTEM SHALL để backend shell-out tới `docker` CLI của host (`child_process.exec`) spawn một container Playwright hardened, ngắn hạn cho từng run.
- WHEN script AI/user cung cấp chạy THE SYSTEM SHALL chỉ chạy nó bên trong container cô lập đó, không bao giờ trong process backend.
- WHEN mỗi run kết thúc THE SYSTEM SHALL xoá container (`--rm`).

### US-3: Là hệ thống, tôi phải hardening container runner (F3).

- WHERE container runner THE SYSTEM SHALL áp dụng: dedicated bridge network (không phải default bridge), `--memory`, `--cpus`, `--pids-limit`, `--cap-drop=ALL`, `--security-opt no-new-privileges`, non-root `pwuser`, `--read-only` root filesystem + `tmpfs /tmp`.
- WHERE Docker host THE SYSTEM SHALL áp dụng `DOCKER-USER` egress rules chặn cloud metadata `169.254.169.254`, link-local, và dải RFC1918.

### US-4: Là hệ thống, tôi tuyệt đối không trao quyền Docker daemon cho backend nhận input.

- THE SYSTEM SHALL NOT mount `/var/run/docker.sock` vào backend (hoặc bất kỳ container xử lý input người dùng).
- THE SYSTEM SHALL NOT chạy backend với `privileged: true`.
- THE SYSTEM SHALL NOT trao quyền root-equivalent tới host Docker daemon cho backend nhận input bằng cách khác (thêm vào group `docker`, expose daemon TCP socket không mTLS/authz).

### US-5: Là hệ thống, tôi giới hạn phạm vi script được chạy và concurrency (F5/F7).

- WHEN chạy test THE SYSTEM SHALL chỉ chạy script lưu server-side; concurrency bị bound (`MAX_CONCURRENT_RUNS`, hiện `2`, per-process).

## Cân nhắc scaling (từ SCALING_SHARED_STATE.md)

- Script store (`scriptStore.js`) là in-memory Map, TTL 30 phút, mất khi restart; `generate` và `run` phải cùng instance nếu không sẽ miss `scriptId`.
- Semaphore concurrency là per-process → tổng host concurrency = `MAX_CONCURRENT_RUNS * instanceCount`.
- Chi tiết & hướng khắc phục: module [scaling](../scaling/requirements.md).

## Nguồn

- [FEATURES.md — Automation testing](../platform-overview/_source/FEATURES.md)
- [RUNNER_EXECUTION_MODEL.md](_source/RUNNER_EXECUTION_MODEL.md)
- [SCALING_SHARED_STATE.md — script store / semaphore](../scaling/_source/SCALING_SHARED_STATE.md)
