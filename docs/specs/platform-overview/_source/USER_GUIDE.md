# Hướng dẫn sử dụng

Hướng dẫn dành cho người dùng cuối của AI Test Case Generator — không cần biết kỹ thuật, chỉ cần biết cách dùng app. Nếu bạn cần cài đặt/deploy, xem [QUICKSTART.md](QUICKSTART.md) (chạy local) hoặc [DEPLOYMENT.md](DEPLOYMENT.md) (deploy thật).

## 1. Đăng ký & đăng nhập

Mở trang app, chọn **"Don't have an account? Register"**, điền:

- **Username** — dùng để đăng nhập, không đổi được sau khi tạo
- **Password** — tối thiểu 8 ký tự
- **Email**
- **Full Name**

Đăng ký xong bạn được tự động đăng nhập và chuyển vào **Dashboard**. Lần sau chỉ cần Username + Password ở màn hình Login.

Không có "quên mật khẩu" tự động — nếu quên, cần người quản trị hệ thống hỗ trợ trực tiếp trên database.

## 2. Workspace — không gian làm việc

Mỗi tài khoản có sẵn một **Personal Workspace** (không gian riêng, chỉ mình bạn thấy). Bạn có thể:

- **Tạo workspace mới** để làm việc nhóm — bấm vào tên workspace ở sidebar → **Create Workspace**.
- **Mời thành viên** vào workspace bạn tạo — chỉ người tạo workspace mới mời được người khác, mời bằng email (người đó phải đã có tài khoản trong hệ thống).
- **Chuyển workspace** — bấm vào tên workspace ở sidebar, chọn workspace khác trong danh sách. Toàn bộ Test Case và Test Plan hiển thị sẽ đổi theo workspace đang chọn.

Trong một workspace nhóm, mọi thành viên **đều thấy chung** một bộ Test Case/Test Plan — tạo/sửa/xoá đều ảnh hưởng tới cả nhóm. Dữ liệu tạo trong Personal Workspace thì chỉ mình bạn thấy.

> Nếu bạn bị gỡ khỏi một workspace trong lúc đang mở app, hệ thống tự chuyển bạn về Personal Workspace và hiện thông báo ngắn giải thích lý do — không cần tải lại trang.

## 3. Quản lý Test Case

Vào mục **Test Cases** ở sidebar.

**Tạo mới** — bấm **New Test Case**, điền:
- Title, Description
- Steps — từng bước thao tác, mỗi bước có "Action" (làm gì) và "Expected Result" (kết quả mong đợi)
- Priority: Critical / High / Medium / Low
- Category, Feature — dùng để nhóm/lọc test case
- Tags — gắn nhãn tự do

**Tìm & lọc** — dùng thanh tìm kiếm (phím tắt `/`), hoặc bộ lọc theo Priority/Status/Category ở đầu trang. Bấm vào tiêu đề cột để sắp xếp.

**Đánh dấu kết quả chạy test** — mở chi tiết một test case, chọn **Pass / Failed / Pending**. Đây là trạng thái thực thi (`executionStatus`), khác với "Status" (Draft/Active/Deprecated) là trạng thái vòng đời của bản thân test case.

**Xoá** — chọn nhiều dòng bằng checkbox rồi **Delete Selected**, hoặc xoá từng cái. Xoá một test case sẽ tự động gỡ nó khỏi mọi Test Plan đang chứa nó; nếu plan đó hết sạch test case, plan tự chuyển sang trạng thái **Obsolete**.

## 4. Quản lý Test Plan

Vào mục **Test Plans**.

**Tạo mới** — **New Test Plan**, đặt tên, mô tả, trạng thái (Planning/In Progress/Completed/On Hold), ngày bắt đầu/kết thúc, rồi chọn các Test Case đưa vào plan.

**Xem chi tiết** — bấm vào một plan ở panel bên trái. Panel bên phải hiện:
- Tổng quan tiến độ (số Pass/Failed/Pending, tỉ lệ Pass)
- Danh sách test case trong plan, nhóm theo Feature
- Đánh dấu Pass/Failed/Pending trực tiếp cho từng test case, ngay tại đây — không cần quay lại trang Test Cases

**Cập nhật real-time** — nếu ai đó (kể cả chính bạn ở tab khác) đổi kết quả một test case đang nằm trong plan bạn đang mở, số liệu tự cập nhật ngay, không cần F5.

**Kết quả tổng thể của plan** — tách biệt với kết quả từng test case, dùng khi bạn muốn đánh giá cả một chu kỳ test là Pass/Failed/Pending nói chung.

**Xuất Excel** — bấm **Export** trên một plan để tải file XLSX gồm thông tin tổng quan + bảng test case.

## 5. Dùng AI để tạo test case/test plan

AI chỉ **gợi ý** — không tự động lưu vào hệ thống, bạn xem và chọn cái nào muốn giữ lại.

- **AI Suggestions** (ở trang Test Cases) — mô tả tính năng cần test (càng chi tiết càng tốt, có thể đính kèm file TXT/PDF/DOCX), AI trả về một loạt test case, bạn chọn cái nào muốn thêm.
- **AI Test Plan** (ở trang Test Plans) — mô tả cả dự án/nhóm tính năng, AI tạo hẳn một plan có nhiều scenario, mỗi scenario vài test case.
- **Improve** — với một test case đã có sẵn, để AI đề xuất bản viết lại rõ ràng/đầy đủ hơn.

Hướng dẫn chi tiết kèm ví dụ prompt: [AI_FEATURES.md](AI_FEATURES.md).

> Nếu quản trị viên chưa cấu hình OpenAI API key, các nút AI sẽ báo lỗi khi bấm — mọi tính năng khác của app không bị ảnh hưởng.

## 6. Import / Export test case hàng loạt

Ở trang Test Cases, bấm **Import**:

1. **Tải template mẫu** (XLSX hoặc CSV) để biết đúng định dạng cột cần có.
2. Điền dữ liệu vào template, hoặc kéo-thả file XLSX/CSV của bạn (tối đa 5MB).
3. Cột **Steps** hỗ trợ hai cách viết: cách nhau bởi dấu `|` (`Bước 1 | Bước 2 | Bước 3`), hoặc dạng JSON array.
4. Bấm **Import Test Cases** — hệ thống báo số dòng hợp lệ/không hợp lệ, kèm chi tiết lỗi nếu có dòng sai định dạng.

Xuất dữ liệu: dùng nút **Export XLSX** ở trang Test Cases (xuất danh sách đang lọc/đang chọn) hoặc nút **Export** trên từng Test Plan.

## 7. Những tính năng chưa hoạt động

- **Tạo Jira ticket** — nút này có trên giao diện (ở test case bị Failed trong một Test Plan) nhưng backend chưa được bật, bấm vào sẽ báo lỗi. Không phải bug của bạn — tính năng này đang chờ cấu hình.
- **Automation Testing** — mục này trên sidebar hiện chỉ là trang giới thiệu "sắp ra mắt", chưa chạy được test tự động thật.

## 8. Câu hỏi thường gặp

**Đăng nhập xong bị đá về lại trang Login?**
Thường do trình duyệt chặn cookie phiên đăng nhập — có thể do app đang chạy ở chế độ thử nghiệm qua HTTP thường (không có ổ khoá HTTPS trên thanh địa chỉ). Báo cho người quản trị hệ thống.

**Không thấy Test Case của đồng nghiệp dù cùng làm chung dự án?**
Kiểm tra cả hai đang chọn đúng cùng một Workspace (không phải Personal Workspace của mỗi người) — xem lại mục 2.

**Bấm nút AI báo lỗi?**
Khả năng cao hệ thống chưa cấu hình OpenAI API key, hoặc đã dùng hết lượt trong 15 phút (giới hạn 30 lượt/15 phút mỗi tài khoản để tránh phát sinh chi phí ngoài ý muốn).

**Import file báo "Validation failed"?**
Tải lại template mẫu và đối chiếu — các cột Title/Description/Category là bắt buộc, Priority và Execution Status phải đúng một trong các giá trị cho phép (xem template để biết chính xác).
