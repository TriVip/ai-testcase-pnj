# Test Case Management — Requirements

Module quản lý test case: tạo/sửa/xoá, theo dõi trạng thái vòng đời và trạng thái thực thi, tìm/lọc/sắp xếp, batch delete. Tổng hợp từ Feature Specification, User Guide và Architecture (data model).

Trạng thái: 🟢 shipped.

## Mô hình dữ liệu liên quan (từ ARCHITECTURE.md)

```
TestCase
 ├─ user: User (owner), workspace: Workspace (optional)
 ├─ title, description, steps: [{stepNumber, action, expectedResult}]
 ├─ priority: Low|Medium|High|Critical
 ├─ status: Draft|Active|Deprecated
 ├─ executionStatus: Pending|Pass|Failed, executionNotes
 ├─ category, feature, tags: [String]
 └─ jiraTicketUrl (do Jira integration set — hiện chưa mount)
```

## User Stories & Acceptance Criteria

### US-1: Là người dùng, tôi muốn tạo/sửa/xoá test case với đầy đủ thuộc tính.

- WHEN người dùng tạo/sửa test case THE SYSTEM SHALL lưu title, description, các bước có thứ tự (mỗi bước gồm action + expected result), priority (Low/Medium/High/Critical), status (Draft/Active/Deprecated), category, feature, và tags tự do.
- WHEN người dùng gửi POST/PUT test case THE SYSTEM SHALL chỉ nhận các field trong whitelist `ALLOWED_FIELDS`; `user` và `workspace` luôn set từ context request, không nhận từ body.

### US-2: Là người dùng, tôi muốn theo dõi kết quả thực thi tách biệt với trạng thái vòng đời của test case.

- WHEN người dùng cập nhật kết quả chạy THE SYSTEM SHALL lưu `executionStatus` (Pending/Pass/Failed) cùng execution notes tự do, độc lập với `status` (Draft/Active/Deprecated).
- WHEN `executionStatus` của một test case thay đổi THE SYSTEM SHALL phản ánh live ở mọi nơi hiển thị test case đó, kể cả bên trong test plan (qua lớp real-time).

### US-3: Là người dùng, tôi muốn tìm/lọc/sắp xếp và xoá hàng loạt test case.

- WHEN người dùng tìm kiếm THE SYSTEM SHALL cho tìm theo title/description/category.
- WHEN người dùng lọc THE SYSTEM SHALL cho lọc theo priority/status/category, và sắp xếp theo bất kỳ cột nào.
- WHEN người dùng chọn nhiều dòng và bấm xoá THE SYSTEM SHALL cho phép batch delete.

### US-4: Là người dùng, tôi muốn việc xoá test case tự động dọn dẹp trong các test plan liên quan trong cùng workspace.

- WHEN một test case bị xoá (đơn lẻ hoặc batch delete) THE SYSTEM SHALL tự động dọn dẹp tham chiếu trong mọi test plan thuộc workspace (hoặc user cá nhân) tương ứng, và kích hoạt tính lại trạng thái tự động của plan đó.
- WHEN một plan không còn test case nào sau khi xoá THE SYSTEM SHALL tự động đánh dấu plan đó là `Obsolete`.

### US-5: Là người dùng, tôi muốn thao tác xoá bị giới hạn tần suất.

- WHEN người dùng gọi DELETE/batch-delete test case quá 10 lần trong 10 giây THE SYSTEM SHALL chặn request vượt ngưỡng (HTTP 429).

### US-6: Là người dùng, tôi muốn xem danh sách test case có hỗ trợ phân trang phía server.

- WHEN client gửi request kèm query params `page` và `limit` THE SYSTEM SHALL trả về tập dữ liệu phân trang cùng metadata `{ total, page, limit, totalPages, hasMore }`.
- WHEN client không gửi params phân trang THE SYSTEM SHALL trả về toàn bộ danh sách để đảm bảo tương thích ngược.

## Nguồn

- [FEATURES.md — Test case management](../platform-overview/_source/FEATURES.md)
- [USER_GUIDE.md — mục 3](../platform-overview/_source/USER_GUIDE.md)
- [ARCHITECTURE.md — Data model / Mass-assignment protection / Rate limiting](../platform-overview/_source/ARCHITECTURE.md)
