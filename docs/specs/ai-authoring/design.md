# AI-Assisted Authoring — Design

Thiết kế kỹ thuật cho lớp AI, tổng hợp từ `ARCHITECTURE.md` và `BUGFIX_OPENAI.md`.

## Ba capability (`services/openai.js`)

- `generateTestCaseSuggestions(featureDescription, count)`
- `generateTestPlanSuggestions(projectDescription)`
- `improveTestCase(testCase)`

Mỗi hàm thực hiện một call `chat.completions.create` (`OPENAI_MODEL`, mặc định `gpt-3.5-turbo`) và trích JSON array/object đầu tiên tìm thấy trong response text qua regex (`extractJSON`). Đặc điểm hiện tại:

- Không dùng `response_format: json_object`.
- Không retry khi lỗi tạm thời, không backoff.
- `insufficient_quota` và `invalid_api_key` map thành thông báo thân thiện; lỗi khác propagate nguyên message OpenAI.
- Cả ba route đều require auth và chia sẻ `aiLimiter` (30 req / 15 phút mỗi user) — mỗi call là call API tính phí.

## Prompt gắn domain

Cả ba prompt hardcode "You are a senior QA engineer... focused exclusively on the e-commerce website PNJ (Phú Nhuận Jewelry)" và hướng model đóng khung gợi ý theo ngữ cảnh đó (jewelry, promotions, store pickup) bất kể input. Chủ đích cho deployment PNJ; genericize là thay đổi prompt, không phải kiến trúc.

## Ngôn ngữ output

Prompt yêu cầu model trả lời tiếng Việt nếu input feature/project bằng tiếng Việt, tiếng Anh nếu không.

## Input file cho AI suggestion

`utils/fileParser.js#extractTextFromFile` trích text từ TXT/PDF/DOCX để làm input cho gợi ý; nhánh PDF hiện dùng `pdf-parse` (xem module [dependencies](../dependencies/requirements.md)). Caller: `routes/ai.js` khi upload file.

## Lazy initialization của OpenAI client (từ BUGFIX_OPENAI.md)

### Vấn đề đã gặp

Các endpoint AI trả lỗi 500 "OpenAI API key is not configured" dù `.env` đã có `OPENAI_API_KEY`.

### Nguyên nhân

Thứ tự load module ES: `services/openai.js` được import vào `routes/ai.js`, code top-level chạy ngay khi import — thời điểm đó `dotenv.config()` trong `server.js` chưa chạy, nên `process.env.OPENAI_API_KEY` là `undefined` và client khởi tạo thành `null`.

### Giải pháp

Chuyển sang **lazy initialization**: khởi tạo client trong `getOpenAIClient()` được gọi bên trong mỗi exported function (sau khi dotenv đã load), thay vì tạo global constant lúc import.

```javascript
const getOpenAIClient = () => {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not configured...');
    }
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};
```

Ngoài ra thêm logging trong `server.js` để verify `OPENAI_API_KEY` được load.

### Bài học ghi nhận

- Lazy initialization: khởi tạo resource khi cần, không phải khi import.
- Load env vars càng sớm càng tốt ở entry point; log & validate env vars quan trọng ngay sau khi load.

## Nguồn

- [ARCHITECTURE.md — AI integration](../platform-overview/_source/ARCHITECTURE.md)
- [BUGFIX_OPENAI.md](_source/BUGFIX_OPENAI.md)
- [AI_FEATURES.md](_source/AI_FEATURES.md)
