# Test Plans — Requirements

Module gom test case thành plan có trạng thái, ngày bắt đầu/kết thúc, kết quả thực thi cấp plan, nhóm theo feature, cập nhật real-time và export XLSX. Tổng hợp từ Feature Specification, User Guide và Architecture.

Trạng thái: 🟢 shipped.

## Mô hình dữ liệu liên quan (từ ARCHITECTURE.md)

```
TestPlan
 ├─ user: User (owner), workspace: Workspace (optional)
 ├─ name, description, testCases: [TestCase]
 ├─ status: Planning|In Progress|Completed|On Hold|Obsolete
 ├─ startDate, endDate
 └─ executionStatus, executionNotes (rollup cấp plan, tách khỏi từng TestCase)
```

## User Stories & Acceptance Criteria

### US-1: Là người dùng, tôi muốn gom test case thành một plan có tên và thuộc tính riêng.

- WHEN người dùng tạo test plan THE SYSTEM SHALL lưu name, description, status (Planning/In Progress/Completed/On Hold/Obsolete), startDate/endDate, và danh sách test case đưa vào.
- WHEN người dùng gửi POST/PUT test plan THE SYSTEM SHALL chỉ nhận field trong whitelist `ALLOWED_FIELDS`; `user` và `workspace` luôn set từ context.

### US-2: Là người dùng, tôi muốn kết quả thực thi cấp plan tách biệt với kết quả từng test case.

- WHEN người dùng đánh giá cả plan THE SYSTEM SHALL lưu `executionStatus` + `executionNotes` cấp plan, tách biệt với `executionStatus` của từng test case bên trong.

### US-3: Là người dùng, tôi muốn xem và thao tác test case trong plan thuận tiện.

- WHEN hiển thị test case trong plan THE SYSTEM SHALL nhóm chúng theo field `feature`.
- WHEN người dùng đánh dấu Pass/Failed/Pending từ trong plan view THE SYSTEM SHALL cập nhật trực tiếp mà không cần rời khỏi plan.
- WHEN mở chi tiết một plan THE SYSTEM SHALL hiển thị tổng quan tiến độ (số Pass/Failed/Pending, tỉ lệ Pass).

### US-4: Là người dùng, tôi muốn cập nhật trạng thái test case được phản ánh real-time trong plan.

- WHEN `executionStatus` của một test case trong plan thay đổi (từ tab khác, hoặc người dùng khác có quyền vào cùng workspace) THE SYSTEM SHALL cập nhật live cho ai đang mở plan đó, không cần refresh.
- WHEN một client yêu cầu join room của plan THE SYSTEM SHALL kiểm tra quyền (chủ plan hoặc thành viên workspace của plan) trước khi cho phép.

### US-5: Là người dùng, tôi muốn export một plan ra XLSX để chia sẻ.

- WHEN người dùng bấm Export trên một plan THE SYSTEM SHALL sinh file XLSX gồm khối tổng quan + bảng test case đầy đủ (phía client).

### US-6: Là hệ thống, tôi muốn plan tự chuyển Obsolete khi rỗng test case.

- WHEN một test case bị xoá khiến plan không còn test case nào THE SYSTEM SHALL tự động đánh dấu plan là `Obsolete`.

## Nguồn

- [FEATURES.md — Test plans](../platform-overview/_source/FEATURES.md)
- [USER_GUIDE.md — mục 4](../platform-overview/_source/USER_GUIDE.md)
- [ARCHITECTURE.md — Data model / Real-time updates (Socket.io)](../platform-overview/_source/ARCHITECTURE.md)
