# Naming Conventions / Quy Ước Đặt Tên Trong TypeScript

## 📖 Tổng Quan / Overview

Quy ước đặt tên nhất quán giúp mã nguồn TypeScript dễ đọc, dễ bảo trì và giúp lập trình viên phân biệt ngay lập tức đâu là **Type/Interface/Class** (cấp độ kiểu / khởi tạo) và đâu là **Variable/Function** (giá trị thực thi).

Consistent naming conventions make TypeScript codebases easier to read and maintain, helping developers immediately distinguish between type-level constructs (Types, Interfaces, Classes) and value-level constructs (variables, functions, properties).

---

## 📋 Bảng Tóm Tắt Quy Ước Đặt Tên / Naming Summary Table

| Thành phần / Construct | Quy ước / Convention | Ví dụ Đúng / Good Example | Ví dụ Cần Tránh / Avoid |
| --- | --- | --- | --- |
| **Class** | `PascalCase` (Danh từ) | `class OrderService {}` | `class orderService {}` |
| **Interface** | `PascalCase` (Không dùng tiền tố `I`) | `interface UserProfile {}` | `interface IUserProfile {}` |
| **Type Alias** | `PascalCase` | `type PaymentStatus = ...` | `type payment_status = ...` |
| **Enum & Enum Member** | `PascalCase` | `enum HttpStatus { NotFound = 404 }` | `enum http_status { not_found }` |
| **Generic Type Parameter** | `T` hoặc `T` + Tên mô tả (`PascalCase`) | `<TData, TError = Error>` | `<data, error>` |
| **Function / Method** | `camelCase` (Động từ) | `function calculateTotal()` | `function CalculateTotal()` |
| **Variable / Parameter** | `camelCase` | `const currentUserId = "1";` | `const current_user_id = "1";` |
| **Boolean Variable** | `camelCase` + `is/has/can/should` | `const isLoading = true;` | `const loading = true;` |
| **Global Constant** | `UPPER_SNAKE_CASE` | `const MAX_RETRY_COUNT = 3;` | `const maxRetryCount = 3;` |
| **File Name (Modules/Utils)** | `kebab-case.ts` | `user-auth.service.ts` | `UserAuth_Service.ts` |

---

## 📝 Ví Dụ Chi Tiết & Giải Thích / Detailed Guidelines & Examples

### 1. Không Dùng Tiền Tố `I` Cho `interface` hoặc `T` Cho `type` / Avoid Hungarian Notation (`IUser`, `TUser`)

Khác với C#, đội ngũ phát triển TypeScript (Microsoft TypeScript Coding Guidelines) và Google TypeScript Style Guide khuyến nghị **không** thêm tiền tố `I` vào trước tên `interface`:

```typescript
// ❌ AVOID - Kiểu Hungarian notation cũ, làm lộ chi tiết cài đặt (interface hay type)
interface IUser {
  id: string;
  name: string;
}
type TUserRole = "admin" | "guest";

// ✅ GOOD - Đặt tên tự nhiên bằng PascalCase
interface User {
  id: string;
  name: string;
}
type UserRole = "admin" | "guest";
```

### 2. Đặt Tên Tham Số Generic Rõ Nghĩa / Meaningful Generic Type Parameters

- Dùng một chữ cái in hoa (`T`, `U`, `K`, `V`) khi kiểu hoàn toàn tổng quát (như hàm tiện ích mảng).
- Dùng tiền tố `T` kèm tên mô tả (`TItem`, `TRequest`, `TResponse`, `TKey`) khi hàm/class có nhiều tham số Generic phức tạp:

```typescript
// ✅ Đơn giản: Dùng T
function firstElement<T>(items: readonly T[]): T | undefined {
  return items[0];
}

// ✅ Phức tạp: Dùng T + PascalCase để dễ phân biệt với interface thật
interface ApiHandler<TRequest, TResponse, TError = Error> {
  execute(payload: TRequest): Promise<TResponse>;
  onError?(error: TError): void;
}
```

### 3. Đặt Tên Biến & Hàm Boolean / Boolean Naming (`is`, `has`, `can`, `should`)

```typescript
interface AccountPermissions {
  // ✅ GOOD - Đọc lên biết ngay là kiểu boolean
  isActive: boolean;
  isEmailVerified: boolean;
  hasTwoFactorAuth: boolean;
  canApproveInvoice: boolean;
  shouldSendNotification: boolean;

  // ❌ AVOID - Mơ hồ, dễ nhầm với string, object hoặc hàm
  active: boolean;
  status: boolean;
  approveInvoice: boolean;
}
```

### 4. Thuộc Tính Private Trong Class / Private Fields (`private` vs `#`)

Trong TypeScript hiện đại, hạn chế dùng dấu gạch dưới `_fieldName` trừ khi có getter trùng tên. Ưu tiên dùng từ khóa `private readonly` (compile-time) hoặc `#fieldName` (ECMAScript hard private lúc runtime):

```typescript
export class BankAccount {
  // Lựa chọn 1: TypeScript compile-time private
  private readonly accountId: string;

  // Lựa chọn 2: ECMAScript native private (#) - bảo mật cả lúc runtime
  #balance: number;

  constructor(accountId: string, initialBalance = 0) {
    this.accountId = accountId;
    this.#balance = initialBalance;
  }

  public getBalance(): number {
    return this.#balance;
  }
}
```

### 5. Tham Số Không Sử Dụng / Unused Parameters (`_param`)

Khi viết callback hoặc implement interface mà không cần dùng đến tham số đầu tiên, hãy thêm dấu gạch dưới `_` ở đầu tên tham số để trình biên dịch TypeScript (`noUnusedParameters`) hiểu là bạn cố tình bỏ qua nó:

```typescript
// Bỏ qua tham số `req` vì chỉ cần dùng `res`
app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});

// Tạo mảng 5 phần tử đánh số từ 0 đến 4
const indices = Array.from({ length: 5 }, (_, index) => index);
```

### 6. Hằng Số và `as const` / Constants & Enums

```typescript
// Hằng số cấu hình cấp module: UPPER_SNAKE_CASE
export const DEFAULT_TIMEOUT_MS = 5000;
export const API_RETRY_LIMIT = 3;

// Object hằng số bất biến với `as const`: PascalCase hoặc UPPER_SNAKE_CASE
export const OrderStatus = {
  Pending: "PENDING",
  Processing: "processing",
  Completed: "COMPLETED",
  Cancelled: "CANCELLED",
} as const;

// Trích xuất Union Type cùng tên với Object (TypeScript cho phép Value và Type trùng tên!)
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];
```

---

## 🎓 Câu Hỏi Phỏng Vấn Thường Gặp / Common Interview Questions

### 1. Tại sao trong TypeScript một biến `const OrderStatus` và một kiểu `type OrderStatus` có thể đặt trùng tên mà không bị lỗi?
- **Trả lời / Answer:** TypeScript tách biệt hai không gian tên (namespaces) độc lập: **Value space** (tồn tại lúc runtime trong JS như biến, hàm, object) và **Type space** (chỉ tồn tại lúc compile như `type`, `interface`). Do đó, bạn có thể khai báo `const OrderStatus = { ... } as const` và `type OrderStatus = ...` cùng tên để vừa dùng như Enum lúc runtime vừa dùng như kiểu dữ liệu lúc compile.

### 2. Sự khác nhau giữa `private field` của TypeScript và `#field` của JavaScript/TypeScript là gì?
- **Trả lời / Answer:**
  - `private field`: Chỉ kiểm tra lúc **compile-time**. Khi biên dịch ra JavaScript, nó trở thành thuộc tính bình thường trên object (có thể bị truy cập qua `(instance as any).field` hoặc `Object.keys()`).
  - `#field` (ECMAScript Private Fields): Là tính năng gốc của JavaScript runtime (**hard private**). Không thể truy cập từ bên ngoài class ngay cả lúc runtime hay qua `JSON.stringify()`.

---

## 📚 Chủ Đề Liên Quan / Related Topics

- [Type vs Interface](../pitfalls/type-vs-interface.md)
- [Strict Mode](strict-mode.md)
- [Typing Functions](typing-functions.md)
