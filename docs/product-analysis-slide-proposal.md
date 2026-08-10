# 🔍 Phân tích sản phẩm & Đề xuất Slide — AI Test Case Generator

> Tài liệu này được tạo bởi AI dựa trên việc đọc và phân tích **toàn bộ codebase** (40+ source files), không dựa trên bất kỳ danh sách tính năng có sẵn nào.
>
> **Ngày tạo:** 2026-08-10

---

## I. TỔNG QUAN SẢN PHẨM

**AI Test Case Generator** (tên hiển thị: **QA Manager**) là một nền tảng quản lý kiểm thử phần mềm toàn diện, tích hợp AI (OpenAI) để tự động sinh test case và test plan. Sản phẩm được thiết kế đặc biệt cho ngữ cảnh **QA/UAT của PNJ (Phú Nhuận Jewelry)** — một hệ thống e-commerce thực tế trong ngành trang sức.

**Triết lý sản phẩm cốt lõi:**
- *"Đưa AI vào quy trình QA thực tế"* — không chỉ sinh test case mà tích hợp sâu vào luồng quản lý, theo dõi bug, và cộng tác nhóm.
- Hỗ trợ **song ngữ Việt-Anh** xuyên suốt (template, bug tracking, AI prompts).
- Thiết kế cho **team QA thực sự** — có workspace, phân quyền, lịch sử thao tác, không chỉ là tool cá nhân.

---

## II. DANH SÁCH TÍNH NĂNG & CƠ CHẾ ĐÃ PHÁT HIỆN (40 mục)

### 🟢 Nhóm 1: Trải nghiệm người dùng (UX & Workflow) — 15 tính năng

| # | Tính năng | Mô tả quan sát |
|---|-----------|-----------------|
| 1 | **Đăng ký/Đăng nhập bằng Username/Password** | Form login + register, JWT httpOnly cookie 7 ngày |
| 2 | **Dashboard KPI** | Tổng TC, pass rate %, active plans, failed — color-coding theo ngưỡng |
| 3 | **Quản lý Test Case** | CRUD: title, description, precondition, test data, steps, priority, status, category, feature, tags |
| 4 | **Execution Status Tracking** | Pending/Pass/Failed/N/A, ghi chú, attribution (ai, khi nào — server-set) |
| 5 | **Quản lý Test Plan** | Gom test case, trạng thái plan 5 levels, start/end date |
| 6 | **Bug Tracking tích hợp** | bugType, bugSeverity, fixStatus, bugId trên mỗi test case |
| 7 | **Trang Bug Tracking riêng** | Tổng hợp bug, lọc fix status, link đến plan |
| 8 | **Import XLSX/CSV** | Upload, map cột, validate row-by-row, gắn vào plan |
| 9 | **Export XLSX** | Test case và test plan, lazy-load ExcelJS |
| 10 | **Template import** | Download template có dropdown validation, sample data |
| 11 | **Workspace & Team Collaboration** | Tạo/mời/rời workspace, phân quyền owner/member |
| 12 | **Dark/Light Mode** | Toggle từ sidebar |
| 13 | **Keyboard Shortcuts** | Cmd/Ctrl + 1-5 chuyển trang nhanh |
| 14 | **Responsive Mobile** | Sidebar hamburger, overlay |
| 15 | **Quick Actions Dashboard** | Tạo nhanh TC, plan, import |

### 🤖 Nhóm 2: AI Engine — 7 tính năng

| # | Tính năng | Mô tả quan sát |
|---|-----------|-----------------|
| 16 | **AI sinh Test Case** | Mô tả → 5-20 TC đầy đủ, chỉ định số lượng hoặc auto detect |
| 17 | **AI sinh Test Plan** | Mô tả dự án → plan 4-6 module phân cấp |
| 18 | **AI cải thiện Test Case** | Review và đề xuất phiên bản tốt hơn |
| 19 | **Upload tài liệu cho AI** | TXT/PDF/DOCX → AI đọc + sinh test case |
| 20 | **Đa ngôn ngữ AI** | Auto-detect Việt/Anh, sinh output tương ứng |
| 21 | **Chọn lọc AI suggestions** | Select/deselect trước khi thêm |
| 22 | **Automation Testing (Planned)** | Placeholder cho Playwright integration |

### 🏗️ Nhóm 3: Công nghệ & Kiến trúc — 18 cơ chế

| # | Cơ chế | Mô tả quan sát |
|---|--------|-----------------|
| 23 | **Auto-sync Plan Status** | Bug "Chưa fix" → plan Failed, tất cả fix → plan Pass |
| 24 | **Real-time WebSocket** | Socket.io rooms, auth handshake, access check |
| 25 | **Activity Log** | Audit trail cho create/update/execution changes |
| 26 | **Workspace data isolation** | Verify membership trước query, chống IDOR |
| 27 | **Field-level write protection** | ALLOWED_FIELDS whitelist |
| 28 | **Stale workspace recovery** | Interceptor auto-retry khi workspace bị reject |
| 29 | **Rate Limiting** | Per-user, per-endpoint, in-memory |
| 30 | **JWT Security hardening** | Reject placeholders, min 32 chars, httpOnly |
| 31 | **NoSQL injection protection** | readCredential() chặn object injection |
| 32 | **Legacy password migration** | Plaintext → bcrypt gradual migration |
| 33 | **CSRF protection by design** | JSON-only body, buộc preflight |
| 34 | **Docker-ready** | docker-compose, nginx, health check |
| 35 | **Monorepo** | npm workspaces: frontend + backend + shared |
| 36 | **Orphan data migration** | Auto-assign Personal Workspace |
| 37 | **Auto-obsolete empty plans** | Xóa hết TC → plan Obsolete |
| 38 | **Batch delete** | Tối đa 50 TC, cleanup references |
| 39 | **Jira Integration (disabled)** | Tạo Jira ticket từ failed TC — commented out |
| 40 | **Helmet security headers** | HSTS, nosniff, frameguard |

---

## III. ĐỀ XUẤT CẤU TRÚC SLIDE (12 Slides)

### Slide 1: Trang bìa
**"QA Manager: Nền tảng quản lý kiểm thử tích hợp AI"**
- Tên sản phẩm: QA Manager / AI Test Case Generator
- Slogan: *"Từ ý tưởng đến test case chỉ trong vài giây"*
- Logo + Dashboard screenshot
- Đội ngũ / tên công ty

> 🎙️ Mở đầu bằng vấn đề: "Team QA mất hàng giờ viết TC thủ công. Nếu AI giúp 80% việc đó?"

### Slide 2: Vấn đề thực tế
- Viết TC thủ công: tốn thời gian, thiếu sót, không nhất quán
- Quản lý bằng Excel: khó cộng tác, không truy vết
- Bug tracking tách rời test plan: mất ngữ cảnh
- Thiếu tool QA phù hợp team Việt Nam

> 🎙️ Kể câu chuyện thực tế của team QA.

### Slide 3: Giải pháp tổng thể
- Nền tảng web: test case + test plan + bug — một chỗ duy nhất
- AI sinh TC từ mô tả hoặc tài liệu
- Song ngữ Việt-Anh
- Workspace & team collaboration

> 🎙️ "Không phải tool demo — thiết kế cho quy trình QA thực tế."

### Slide 4: AI sinh Test Case — Trái tim sản phẩm
- Mô tả text hoặc upload file → AI sinh 5-20 TC đầy đủ
- Mỗi TC: tiêu đề, mô tả, bước chi tiết, expected result, priority, category
- Chọn lọc trước khi thêm
- Auto-detect ngôn ngữ Việt/Anh

> 🎙️ **Demo trực tiếp** — nhập tiếng Việt, sinh, chọn, thêm. Đây là "wow moment."

### Slide 5: AI sinh Test Plan & Improve
- Mô tả dự án → plan nhiều module, mỗi module nhiều TC
- "Improve": AI review TC hiện có → đề xuất phiên bản tốt hơn
- AI hiểu ngữ cảnh PNJ (trang sức, khuyến mãi, mua online)

> 🎙️ So sánh trước/sau AI improve.

### Slide 6: Quản lý Test Case chuyên nghiệp
- Rich fields: precondition, test data, multi-step, tags, category, feature
- Execution tracking: Pass/Failed/Pending/N/A + attribution
- Batch delete, auto-cleanup plan references

> 🎙️ "Server tự set attribution — AI không giả mạo được."

### Slide 7: Test Plan — Kiểm thử có hệ thống
- Gom TC vào plan, theo dõi tiến độ
- Plan status auto-sync từ bug tracking
- Real-time update qua WebSocket
- Auto-obsolete plan rỗng

> 🎙️ "Member A mark Failed → member B thấy ngay, không cần refresh."

### Slide 8: Bug Tracking tích hợp
- Ghi nhận bug trực tiếp trên TC (loại, mức độ, fix status, Bug ID)
- Trang Bug Tracking tổng hợp, lọc theo fix status
- Link nhanh đến plan chứa bug
- 1 bug chưa fix = plan fail (logic veto)

> 🎙️ "Bug tracking TRONG luồng kiểm thử — không phải tab/tool khác."

### Slide 9: Import/Export — Cầu nối với Excel
- Import XLSX/CSV: template có sẵn, dropdown validation, auto-map Việt/Anh
- Gắn ngay vào plan khi import (mới hoặc có sẵn)
- Export TC và plan ra Excel
- Drag & drop upload

> 🎙️ "Đang dùng Excel? Import nguyên vào, tiếp tục trên web."

### Slide 10: Workspace & Cộng tác nhóm
- Personal Workspace tự động khi đăng ký
- Team Workspace: mời email, owner/member
- Leave/remove member
- Data isolation hoàn toàn giữa workspace

> 🎙️ "Mỗi dự án, mỗi team — không gian riêng, không xung đột."

### Slide 11: Bảo mật & Kiến trúc
- JWT httpOnly, bcrypt, chống injection + CSRF
- Rate limiting, field-level protection
- Activity Log: audit trail mọi thao tác
- Docker-ready, health check, Helmet headers

> 🎙️ "Production-grade security, không phải prototype."

### Slide 12: Roadmap & Tầm nhìn
- ✅ AI Test Case/Plan, Bug Tracking, Workspace, Import/Export, Real-time
- 🔜 Automation Testing (Playwright), Jira Integration
- 🎯 Tầm nhìn: QA hoàn chỉnh viết → chạy → theo dõi → báo cáo

> 🎙️ "Mục tiêu: team QA chỉ cần MỘT công cụ duy nhất."

---

## IV. ĐÁNH GIÁ ĐIỂM MẠNH NHẤT

> **Sự tích hợp sâu giữa AI và quy trình QA thực tế.**

AI sinh → chọn lọc → thêm vào hệ thống → gom plan → execution → bug → auto-sync plan status — tất cả trong một luồng liền mạch.

**Rủi ro:** Nếu chỉ demo "nhập text → AI sinh TC" thì dễ bị coi là wrapper ChatGPT. Cần nhấn mạnh **luồng end-to-end** — đó mới là giá trị thực.
