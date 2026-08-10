# Automation Runner — Design

Mô hình thực thi runner và lý do bảo mật, tổng hợp từ `RUNNER_EXECUTION_MODEL.md` (F8).

> Lưu ý phạm vi: tài liệu gốc là documentation + verification cho một nhánh Playwright runner **chưa merge**. `playwrightRunner.js` và sandbox firewall được mô tả **không tồn tại** trong repo hiện tại. Đây là thiết kế mục tiêu/ràng buộc, không phải hành vi đang chạy.

## 1. Mô hình thực thi

Backend (Express API) **không** chạy script không tin cậy in-process. Khi có yêu cầu run, backend **shell-out tới `docker` CLI của host** (`child_process.exec` trong `playwrightRunner.js`) để spawn một container Playwright hardened, ngắn hạn cho từng run. Script không tin cậy chỉ chạy bên trong container cô lập đó.

Thuộc tính chính:
- Backend gọi `docker run ...` vào **host Docker daemon** qua Docker CLI/socket ở mức host.
- Backend **KHÔNG** mount `/var/run/docker.sock` vào container xử lý input.
- Backend **KHÔNG** chạy `privileged: true`.
- Mỗi run là container mới, xoá khi exit (`--rm`).
- Script chạy với hardening F3 (network riêng, `--memory`, `--cpus`, `--pids-limit`, `--cap-drop=ALL`, `--security-opt no-new-privileges`, non-root `pwuser`, `--read-only` + `tmpfs /tmp`).

### Thực tế deployment hiện tại

`docker-compose.yml` chỉ định nghĩa `backend` và `frontend`; backend **không** được cấp Docker socket và **không** privileged. Vì runner cần Docker daemon lúc runtime, mô hình hiện tại ngụ ý backend chạy nơi daemon Docker của host truy cập được — điều F8 muốn làm rõ: **runner phụ thuộc host Docker, và phụ thuộc đó phải được cấp mà không trao cho backend nhận input quyền root-equivalent lên host daemon.**

## 2. Lý do bảo mật (vì sao cấm docker.sock)

Mount `/var/run/docker.sock` vào một container trao cho nó toàn quyền host Docker daemon → ai nói chuyện được với daemon có thể start container bind-mount host root fs chạy root = **root trên host**, container escape tầm thường. Backend là nơi nhận/​xử lý input không tin cậy, nên cấp socket cho nó nghĩa là một bug/injection ở request handling leo thẳng lên host takeover.

## 3. Deployment khuyến nghị (theo thứ tự ưu tiên)

1. **Host/VM riêng cho runs** — chạy container không tin cậy trên host/VM chuyên dụng, cô lập khỏi app host và credentials (metadata cloud, DB, secrets).
2. **Dịch vụ runner riêng, có kiểm soát truy cập** — chèn một runner service mỏng giữa backend và daemon; backend gửi request "run script X" tối thiểu, đã validate, qua kênh nội bộ có auth; chỉ runner được spawn container.
3. **Rootless / sandboxed Docker** — nếu buộc launch sibling container từ cùng host, ưu tiên rootless Docker để daemon compromise ≠ host root.

Trong mọi trường hợp: giữ hardening F3 trên container runner và áp `DOCKER-USER` egress firewall (chặn metadata `169.254.169.254`, link-local, RFC1918).

## 4. Verification snapshot (từ tài liệu gốc)

Kiểm tra repo cho socket mount và privileged: `grep` cho `docker.sock`/`/var/run/docker`/`privileged` → **không match**; `docker-compose.yml` chỉ có `backend` và `frontend`, backend không socket mount, không privileged; Dockerfile không socket/privileged. Kết quả: **PASS** — không có cấu hình bị cấm.

## Nguồn

- [RUNNER_EXECUTION_MODEL.md](_source/RUNNER_EXECUTION_MODEL.md)
