# Automation Runner — Tasks

Hạng mục từ "Hard rules checklist" trong `RUNNER_EXECUTION_MODEL.md` (F8). Đây là các ràng buộc KHÔNG được vi phạm khi triển khai runner.

- [ ] **KHÔNG** thêm `- /var/run/docker.sock:/var/run/docker.sock` vào service `backend` (hoặc bất kỳ container xử lý input người dùng).
- [ ] **KHÔNG** chạy backend với `privileged: true`.
- [ ] **KHÔNG** trao backend nhận input quyền root-equivalent lên host Docker daemon bằng cách khác (thêm vào group `docker` trong container dùng chung, expose daemon TCP socket không mTLS/authz).
- [ ] **GIỮ** các cờ hardening F3 trên mọi container runner (`--cap-drop=ALL`, `--security-opt no-new-privileges`, non-root, `--read-only`, resource limits, network riêng).
- [ ] **ÁP** các `DOCKER-USER` egress rules trên Docker host để runner không tới được metadata endpoint hay internal networks.

> Lưu ý: rotation/infra actions là việc của operator review & apply. Tài liệu gốc không đổi hành vi.

## Nguồn

- [RUNNER_EXECUTION_MODEL.md — Hard rules checklist](_source/RUNNER_EXECUTION_MODEL.md)
