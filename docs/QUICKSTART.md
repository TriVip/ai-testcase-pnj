# Quick Start Guide

## ✅ Đã hoàn thành

Dự án đã được chuyển sang **username/password authentication** thay vì Google OAuth.

## 🚀 Cách chạy ứng dụng

### 1. Tạo file `.env`

```bash
cp .env.example .env
```

Sau đó mở `.env` và điền `MONGODB_URI` cùng `JWT_SECRET`.

**`JWT_SECRET` là bắt buộc.** Server sẽ từ chối khởi động nếu giá trị này trống,
ngắn hơn 32 ký tự, hoặc là một trong các placeholder đã biết. Sinh giá trị bằng:

```bash
openssl rand -base64 48
```

### 2. Thêm OpenAI API Key (tùy chọn)

```bash
OPENAI_API_KEY=sk-your-api-key-here
```

> **Lưu ý**: Nếu không có OpenAI API key, bạn vẫn có thể sử dụng tất cả tính năng khác, chỉ tính năng AI suggestions sẽ không hoạt động.

### 3. Chạy ứng dụng

```bash
npm run dev
```

Ứng dụng sẽ chạy trên:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:9999

### 4. Đăng ký tài khoản

1. Mở trình duyệt: http://localhost:5173
2. Click "Don't have an account? Register"
3. Điền thông tin:
   - Username: `admin`
   - Password: `admin12345` — mật khẩu phải từ **8 ký tự** trở lên
   - Email: `admin@example.com`
   - Full Name: `Admin User`
4. Click "Register"

### 5. Đăng nhập

Sau khi đăng ký, bạn sẽ được tự động đăng nhập và chuyển đến Dashboard.

## 📝 Tính năng

- ✅ **Đăng ký/Đăng nhập** với username/password
- ✅ **Quản lý Test Cases** - Tạo, sửa, xóa test cases
- ✅ **Quản lý Test Plans** - Tổ chức test cases thành plans
- ✅ **Export XLSX** - Xuất test cases ra file Excel
- ⚠️ **AI Suggestions** - Cần OpenAI API key

## 🔧 Troubleshooting

### Lỗi: Port 5173 đang được sử dụng

```bash
# Tìm process đang dùng port 5173
lsof -ti:5173 | xargs kill -9

# Hoặc dùng port khác
cd frontend
PORT=3000 npm run dev
```

### Lỗi: MongoDB connection failed

Đảm bảo MongoDB đang chạy:

```bash
# Nếu dùng MongoDB local
brew services start mongodb-community

# Hoặc dùng MongoDB Atlas (khuyến nghị)
# Cập nhật MONGODB_URI trong .env
```

## 📚 Tài khoản test

Sau khi đăng ký lần đầu, bạn có thể tạo thêm tài khoản test (mật khẩu tối thiểu 8 ký tự):

- Username: `tester1` / Password: `tester12345`
- Username: `qa` / Password: `qapassword1`

## 🎯 Next Steps

1. Đăng ký tài khoản
2. Tạo test cases
3. Tạo test plans
4. Export ra XLSX
5. (Optional) Thêm OpenAI API key để dùng AI suggestions
