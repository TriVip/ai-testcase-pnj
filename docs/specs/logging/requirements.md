# Logging — Requirements

Module đề xuất áp dụng structured logging cho backend. Tổng hợp từ LOGGING_RECOMMENDATION.md (F26).

Trạng thái gốc: **Deferred** — chỉ là khuyến nghị. Chưa cài logger, chưa viết lại `console.*` nào như một phần của task này. Áp dụng cần thêm dependency và phê duyệt rõ ràng.

## Hiện trạng (từ tài liệu gốc)

Backend log bằng các call `console.log`/`console.error` rải rác → output plain-text phi cấu trúc, khó filter/aggregate/search trong môi trường thật, không có log level và không redaction.

## User Stories & Acceptance Criteria

### US-1: Là người vận hành, tôi muốn log dạng JSON có cấu trúc.

- WHEN backend ghi log THE SYSTEM SHALL (khi áp dụng) xuất JSON machine-parseable để aggregation và search.

### US-2: Là người vận hành, tôi muốn điều khiển verbosity theo môi trường.

- WHEN cấu hình log level THE SYSTEM SHALL hỗ trợ `trace`/`debug`/`info`/`warn`/`error`/`fatal`, điều khiển qua env var (ví dụ `LOG_LEVEL`) để dev và prod khác nhau.

### US-3: Là người vận hành, tôi muốn log mỗi HTTP request/response.

- WHEN có request HTTP THE SYSTEM SHALL (qua `pino-http`) log correlation id, method, path, status, latency.

### US-4: Là người vận hành, tôi muốn redact field nhạy cảm.

- WHERE log THE SYSTEM SHALL cấu hình pino `redact` để loại secrets/PII (ví dụ `req.headers.authorization`, `req.headers.cookie`, password/token fields, API keys).

### US-5: Là lập trình viên, tôi muốn logging nhất quán qua một logger dùng chung.

- WHEN ghi log THE SYSTEM SHALL route mọi call qua một shared logger instance thay cho `console.log`/`console.error` rải rác.

## Nguồn

- [LOGGING_RECOMMENDATION.md](_source/LOGGING_RECOMMENDATION.md)
