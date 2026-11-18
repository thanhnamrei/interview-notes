# `any` vs `unknown` (và `never`) / Phân Biệt `any`, `unknown` và `never`

## 📖 Định Nghĩa / Definition

Trong TypeScript, `any` và `unknown` đều là **top types** (có thể nhận bất kỳ giá trị nào), nhưng khác nhau hoàn toàn về mức độ an toàn kiểu (**type safety**):

- **`any`**: Tắt hoàn toàn kiểm tra kiểu (type checking) của TypeScript. Cho phép truy cập bất kỳ thuộc tính hoặc gọi bất kỳ hàm nào mà không báo lỗi lúc compile.
- **`unknown`**: Là phiên bản **type-safe** của `any`. Bạn có thể gán bất kỳ giá trị nào cho biến kiểu `unknown`, nhưng **không thể** thao tác trên biến đó cho đến khi thu hẹp kiểu (**type narrowing**) hoặc ép kiểu (**type assertion**).
- **`never`**: Là **bottom type** (kiểu rỗng), đại diện cho các giá trị không bao giờ xảy ra (hàm luôn ném lỗi, vòng lặp vô tận, hoặc nhánh kiểm tra vét cạn).

In TypeScript, both `any` and `unknown` are **top types** (can hold any value), but they differ fundamentally in **type safety**:

- **`any`**: Completely disables TypeScript's type checking. Allows accessing any property or calling any method without compile-time errors.
- **`unknown`**: The **type-safe** counterpart of `any`. Anything is assignable to `unknown`, but you **cannot** perform operations on an `unknown` value without first narrowing or asserting its type.
- **`never`**: The **bottom type** (empty type), representing values that never occur (functions that always throw, infinite loops, or exhaustive checks).

---

## 📊 So Sánh Nhanh / Quick Comparison

| Đặc điểm / Feature | `any` | `unknown` | `never` |
| --- | --- | --- | --- |
| Gán mọi kiểu vào nó / Assign anything to it | ✅ Có / Yes | ✅ Có / Yes | ❌ Không / No |
| Gán nó cho kiểu khác / Assign it to other types | ✅ Có (nguy hiểm!) / Yes (unsafe!) | ❌ Không (cần narrowing) / No | ✅ Có / Yes |
| Gọi thuộc tính/method trực tiếp / Direct property access | ✅ Cho phép / Allowed | ❌ Báo lỗi compile / Compile error | ❌ Không có / None |
| Mức độ an toàn / Type Safety | 🔴 Không an toàn / Unsafe | 🟢 An toàn / Safe | 🟢 An toàn / Safe |

---

## 📝 Ví Dụ Minh Họa / Code Examples

### 1. Nguy Hiểm Khi Dùng `any` / The Danger of `any`

```typescript
// ❌ BAD - Dùng any làm mất hoàn toàn lợi ích của TypeScript
function processUserData(data: any) {
  // Không báo lỗi lúc compile, nhưng sẽ crash lúc runtime nếu data là null hoặc không có name!
  console.log(data.user.name.toUpperCase());
  data.nonExistentMethod();
}

processUserData(null); // 💥 Runtime Error: Cannot read properties of null
```

### 2. An Toàn Với `unknown` & Type Narrowing / Safe Handling with `unknown`

```typescript
// ✅ GOOD - Dùng unknown bắt buộc phải kiểm tra kiểu trước khi sử dụng
function processUserDataSafe(data: unknown) {
  // ❌ Lỗi compile ngay lập tức nếu truy cập trực tiếp:
  // console.log(data.name); // Error: 'data' is of type 'unknown'.

  // 1. Dùng typeof cho kiểu nguyên thủy (primitives)
  if (typeof data === "string") {
    console.log(data.toUpperCase()); // TypeScript hiểu data là string
    return;
  }

  // 2. Dùng instanceof cho class instances
  if (data instanceof Error) {
    console.log(data.message); // TypeScript hiểu data là Error
    return;
  }

  // 3. Dùng Custom Type Guard cho Object
  if (isUser(data)) {
    console.log(data.name.toUpperCase()); // An toàn tuyệt đối!
  }
}

interface User {
  id: number;
  name: string;
}

// Custom Type Guard (Type Predicate: `val is User`)
function isUser(val: unknown): val is User {
  return (
    typeof val === "object" &&
    val !== null &&
    "id" in val &&
    typeof (val as Record<string, unknown>).id === "number" &&
    "name" in val &&
    typeof (val as Record<string, unknown>).name === "string"
  );
}
```

### 3. Ứng Dụng Thực Tế: Parse JSON & Bắt Lỗi `catch` / Real-World Scenarios

#### Xử lý `JSON.parse` an toàn / Safe `JSON.parse`

Mặc định `JSON.parse()` trả về `any`, rất dễ gây lỗi ngầm trong ứng dụng:

```typescript
// ❌ BAD - Tin tưởng mù quáng kết quả từ JSON.parse
const config = JSON.parse(rawJsonString); // kiểu là any
console.log(config.port.toFixed()); // Có thể crash lúc runtime

// ✅ GOOD - Ép kết quả về unknown và validate (hoặc dùng thư viện như Zod)
function safeJsonParse(text: string): unknown {
  return JSON.parse(text);
}

const parsed = safeJsonParse('{"port": 8080}');
if (
  typeof parsed === "object" &&
  parsed !== null &&
  "port" in parsed &&
  typeof parsed.port === "number"
) {
  console.log(parsed.port.toFixed());
}
```

#### Xử lý lỗi trong khối `catch (error: unknown)` / Handling `catch` Errors

Từ TypeScript 4.0+, bạn nên cấu hình `useUnknownInCatchVariables: true` (bật sẵn trong `strict: true`):

```typescript
// ✅ GOOD - Xử lý lỗi trong catch với unknown
async function fetchProfile(url: string) {
  try {
    const res = await fetch(url);
    return await res.json();
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    } else if (typeof error === "string") {
      console.error("String error:", error);
    } else {
      console.error("Unexpected error:", error);
    }
  }
}
```

### 4. Sử Dụng `never` Để Kiểm Tra Vét Cạn / Exhaustive Checking with `never`

```typescript
type PaymentMethod = "credit_card" | "bank_transfer" | "crypto";

function getPaymentFee(method: PaymentMethod): number {
  switch (method) {
    case "credit_card":
      return 0.03;
    case "bank_transfer":
      return 0.005;
    case "crypto":
      return 0.01;
    default: {
      // Nếu sau này thêm kiểu mới vào PaymentMethod mà quên xử lý ở switch,
      // dòng dưới đây sẽ báo lỗi compile ngay lập tức!
      const _exhaustiveCheck: never = method;
      throw new Error(`Unhandled payment method: ${_exhaustiveCheck}`);
    }
  }
}
```

---

## 🎓 Câu Hỏi Phỏng Vấn Thường Gặp / Common Interview Questions

### 1. Khi nào dùng `unknown` thay vì `any`? / When should you use `unknown` over `any`?
- **Trả lời / Answer:** Luôn ưu tiên dùng `unknown` khi bạn không biết trước kiểu dữ liệu đầu vào (ví dụ: dữ liệu từ API bên ngoài, `JSON.parse`, tham số hàm tổng quát, biến `error` trong `catch`). `unknown` buộc developer phải kiểm tra kiểu trước khi sử dụng, ngăn ngừa lỗi runtime `TypeError: Cannot read properties of undefined`. Chỉ dùng `any` khi đang migrate dần từ dự án JavaScript cũ sang TypeScript.

### 2. Sự khác nhau giữa `unknown` và `never` là gì? / What is the difference between `unknown` and `never`?
- **Trả lời / Answer:**
  - `unknown` là **top type** (hợp của mọi kiểu): mọi kiểu đều có thể gán cho `unknown`, nhưng `unknown` không thể gán cho kiểu nào khác (trừ chính nó và `any`) nếu chưa thu hẹp kiểu.
  - `never` là **bottom type** (tập rỗng): không kiểu nào có thể gán cho `never` (trừ chính `never`), nhưng `never` có thể gán cho mọi kiểu. Nó dùng cho hàm không bao giờ trả về hoặc dùng để kiểm tra vét cạn (`exhaustive switch`).

### 3. Type Predicate (`x is Type`) hoạt động như thế nào? / How does a Type Predicate work?
- **Trả lời / Answer:** Một hàm trả về `param is SomeType` (Type Guard) báo cho trình biên dịch TypeScript biết rằng nếu hàm trả về `true`, biến `param` trong phạm vi khối `if` sẽ được thu hẹp (narrowed) thành kiểu `SomeType`.

---

## 📚 Chủ Đề Liên Quan / Related Topics

- [Strict Mode](../best-practices/strict-mode.md)
- [Type vs Interface](type-vs-interface.md)
- [Null vs Undefined](null-undefined.md)
