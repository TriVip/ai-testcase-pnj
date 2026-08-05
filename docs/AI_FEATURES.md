# 🤖 AI Features Documentation

## Tổng quan

Ứng dụng AI Test Case Generator đã được nâng cấp với các tính năng AI mạnh mẽ sử dụng OpenAI GPT để tự động hóa việc tạo và cải thiện test cases và test plans.

---

## 📋 Các tính năng AI

### 1. 🤖 AI Test Case Suggestions

**Mô tả:** Tự động tạo test cases dựa trên mô tả feature.

**Cách sử dụng:**
1. Vào trang **Test Cases**
2. Click button **🤖 AI Suggestions**
3. Nhập mô tả feature (càng chi tiết càng tốt)
4. Click **Generate Suggestions**
5. Chọn các test cases muốn thêm
6. Click **Add Selected**

**Ví dụ prompt:**
```
User login functionality with email and password, including remember me option, 
forgot password link, and account lockout after 3 failed attempts
```

**Kết quả:**
- 5-8 test cases đa dạng
- Bao gồm: Happy path, Edge cases, Error handling, Security, Performance
- Mỗi test case có: Title, Description, Steps, Priority, Category

---

### 2. 🚀 AI Test Plan Generator

**Mô tả:** Tự động tạo test plan hoàn chỉnh với nhiều test scenarios và test cases.

**Cách sử dụng:**
1. Vào trang **Test Plans**
2. Click button **🚀 AI Test Plan**
3. Nhập mô tả project/feature set
4. Click **🤖 Generate Test Plan**
5. Review test plan structure
6. Click **✅ Create Test Plan**

**Ví dụ prompt:**
```
E-commerce website with user registration, product catalog with search and filters, 
shopping cart, checkout with payment integration, order management, and admin dashboard
```

**Kết quả:**
- Test plan được tổ chức theo scenarios/modules
- 4-6 major test scenarios
- Mỗi scenario có 3-5 test cases chi tiết
- Tự động tạo tất cả test cases và test plan trong database

---

### 3. ✨ AI Improve Test Case

**Mô tả:** Cải thiện test case hiện có bằng AI để làm cho nó chi tiết và chuyên nghiệp hơn.

**Cách sử dụng:**
1. Vào trang **Test Cases**
2. Tìm test case muốn cải thiện
3. Click icon **✨** trên test case card
4. Confirm để thay thế version hiện tại
5. Đợi AI phân tích và cải thiện
6. Xem kết quả và improvements

**AI sẽ cải thiện:**
- Làm rõ title và description
- Thêm chi tiết vào test steps
- Thêm test data cụ thể
- Cải thiện expected results
- Đảm bảo follow best practices

---

## ⚙️ Cấu hình

### Yêu cầu

1. **OpenAI API Key** - Lấy từ [OpenAI Platform](https://platform.openai.com/)
2. **MongoDB Atlas** - Database cloud để lưu trữ

### Thiết lập

Cập nhật file `.env`:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo  # hoặc gpt-4 cho kết quả tốt hơn

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/testcase-gen?retryWrites=true&w=majority
```

---

## 🎯 Best Practices

### Viết prompts hiệu quả

1. **Specific:** Mô tả cụ thể, chi tiết
2. **Context:** Cung cấp ngữ cảnh về hệ thống
3. **Requirements:** Nêu rõ yêu cầu và constraints
4. **Examples:** Đưa ví dụ test data nếu có

### Ví dụ prompts tốt:

**Test Cases:**
```
API endpoint POST /api/users/register accepting JSON body with name, email, password.
Must validate email format, password length (8+ chars), check duplicate emails,
return 201 on success with user object, 400 on validation error, 409 on duplicate
```

**Test Plans:**
```
Mobile banking app with:
- User authentication (biometric + PIN)
- Account overview (balance, transactions)
- Money transfer (internal + external)
- Bill payment
- Card management
- Security features (session timeout, encryption)
```

---

## 📊 Tính năng UX

### Toast Notifications

Tất cả AI operations đều có toast notifications:
- ✅ Success messages
- ❌ Error messages với chi tiết
- ⚠️ Warning messages
- ℹ️ Info messages trong quá trình xử lý

### Loading States

- Spinner animations trong lúc AI đang generate
- Disable buttons để tránh duplicate requests
- Progress indicators cho operations dài

---

## 🔍 Troubleshooting

### Lỗi: "OpenAI API key is not configured"

**Giải pháp:**
1. Kiểm tra file `.env` có `OPENAI_API_KEY` chưa
2. Restart server sau khi thêm API key
3. Verify API key còn valid trên OpenAI Platform

### Lỗi: "OpenAI API quota exceeded"

**Giải pháp:**
1. Kiểm tra usage limits trên OpenAI dashboard
2. Upgrade plan hoặc add payment method
3. Đợi reset quota (nếu dùng free tier)

### Lỗi: "Failed to generate suggestions"

**Giải pháp:**
1. Kiểm tra internet connection
2. Verify API key còn valid
3. Thử lại với prompt ngắn hơn
4. Check server logs để xem error chi tiết

### AI tạo kết quả không như mong đợi

**Giải pháp:**
1. Cải thiện prompt (thêm chi tiết, context)
2. Thử generate lại (AI có tính random)
3. Sử dụng GPT-4 thay vì GPT-3.5 (tốt hơn nhưng đắt hơn)
4. Edit kết quả manually hoặc dùng AI Improve

---

## 💡 Tips & Tricks

1. **Batch Generation:** Tạo nhiều test cases cùng lúc bằng AI Test Plan thay vì từng cái một
2. **Iterative Improvement:** Dùng AI Improve nhiều lần cho đến khi hài lòng
3. **Hybrid Approach:** Dùng AI tạo draft, sau đó edit manually
4. **Template Prompts:** Lưu các prompts hiệu quả để reuse
5. **Review Always:** Luôn review AI-generated content trước khi sử dụng production

---

## 📈 Roadmap

Các tính năng AI sắp tới:

- [ ] AI-powered test data generation
- [ ] Smart test case prioritization
- [ ] Automatic bug report generation from failed tests
- [ ] Test coverage analysis and suggestions
- [ ] Integration test scenario generation
- [ ] Performance test scenario suggestions

---

## 🤝 Support

Nếu gặp vấn đề hoặc có câu hỏi:
1. Kiểm tra phần Troubleshooting ở trên
2. Xem server logs trong terminal
3. Kiểm tra browser console (F12)

---

**Version:** 2.0.0  
**Last Updated:** February 2026  
**AI Model:** OpenAI GPT-3.5-turbo / GPT-4
