# Typing Functions Best Practices / Các Quy Tắc Định Kiểu Cho Hàm

## 📖 Tổng Quan / Overview

Hàm (Functions) là khối xây dựng cốt lõi trong TypeScript. Định kiểu hàm đúng cách giúp API rõ ràng, hỗ trợ tự động gợi ý code (IntelliSense) chính xác và tránh các lỗi truyền sai tham số hoặc xử lý sai kết quả trả về.

Functions are the primary building blocks of any TypeScript application. Properly typing parameters, return values, overloads, and callbacks ensures self-documenting APIs and strong compile-time guarantees.

---

## 📝 Các Quy Tắc Quan Trọng / Core Best Practices

### 1. Luôn Khai Báo Kiểu Trả Về Cho Public/Exported Functions / Explicit Return Types

Mặc dù TypeScript có thể tự suy luận kiểu trả về (return type inference), việc ghi rõ kiểu trả về cho các hàm được `export` mang lại 3 lợi ích lớn:
1. Ngăn việc vô tình thay đổi kiểu trả về làm hỏng code ở nơi gọi.
2. Tăng tốc độ kiểm tra kiểu của trình biên dịch TypeScript (`isolatedDeclarations`).
3. Báo lỗi ngay bên trong hàm thay vì báo lỗi ở nơi gọi hàm.

```typescript
interface User {
  id: string;
  role: "admin" | "member";
}

// ❌ BAD - Không ghi rõ kiểu trả về; chữ "admin" bị suy luận rộng thành `string`!
export function createAdminBad(id: string) {
  return {
    id,
    role: "admin", // Suy luận thành { id: string; role: string } -> Không khớp với User!
  };
}

// ✅ GOOD - Ghi rõ kiểu trả về `: User`
export function createAdminGood(id: string): User {
  return {
    id,
    role: "admin", // TypeScript kiểm tra chặt chẽ với kiểu "admin" | "member"
  };
}
```

### 2. Tham Số Tùy Chọn Đặt Ở Cuối & Ưu Tiên Options Object / Optional Parameters & Options Object

Khi một hàm có từ **3 tham số trở lên** hoặc nhiều tham số boolean/optional, hãy gom chúng vào một **Options Object** kèm giá trị mặc định:

```typescript
// ❌ BAD - Khó nhớ thứ tự tham số, truyền `true, false` rất khó đọc ở nơi gọi
function fetchProductsBad(
  category: string,
  page?: number,
  limit?: number,
  includeOutOfStock?: boolean,
  sortByPrice?: boolean
) { /* ... */ }

fetchProductsBad("books", 1, 20, true, false); // true, false nghĩa là gì?

// ✅ GOOD - Dùng Options Object (Named Parameters pattern)
interface FetchProductsOptions {
  category: string;
  page?: number;
  limit?: number;
  includeOutOfStock?: boolean;
  sortByPrice?: boolean;
}

function fetchProductsGood({
  category,
  page = 1,
  limit = 20,
  includeOutOfStock = false,
  sortByPrice = true,
}: FetchProductsOptions) {
  return { category, page, limit, includeOutOfStock, sortByPrice };
}
```

### 3. Phân Biệt `() => void` và `() => undefined` Trong Callback

Trong TypeScript, một kiểu callback `() => void` có nghĩa là **"hàm gọi sẽ bỏ qua bất kỳ giá trị nào mà callback trả về"**, chứ không bắt buộc callback phải không return gì!

```typescript
const items: number[] = [];
const source = [1, 2, 3];

// Array.prototype.push trả về `number` (độ dài mới của mảng),
// nhưng forEach nhận callback `(item: number) => void` vẫn hợp lệ!
source.forEach((item) => items.push(item)); // ✅ Hợp lệ vì kiểu trả về là `void`

// Ngược lại, nếu định nghĩa `() => undefined`, callback BẮT BUỘC phải trả về undefined:
function runStrictCallback(cb: () => undefined) {
  cb();
}
// ❌ Lỗi: Type 'number' is not assignable to type 'undefined'
// runStrictCallback(() => items.push(4));
```

### 4. Function Overloads vs Union Types

- **Ưu tiên Union Types** nếu kiểu trả về không thay đổi theo từng loại đầu vào.
- **Dùng Function Overloads** (hoặc Generics) khi kiểu trả về **phụ thuộc trực tiếp** vào kiểu của tham số truyền vào.

```typescript
// 1. Khi kiểu trả về luôn là number -> Dùng Union Type đơn giản, KHÔNG cần overload!
function getLength(input: string | unknown[]): number {
  return input.length;
}

// 2. Khi kiểu trả về phụ thuộc vào kiểu đầu vào -> Dùng Function Overloads
function parseInput(input: string): string[];
function parseInput(input: number): number;
// Implementation signature (không thể gọi trực tiếp từ bên ngoài)
function parseInput(input: string | number): string[] | number {
  if (typeof input === "string") {
    return input.split(",");
  }
  return input * 2;
}

const arr = parseInput("a,b,c"); // Kiểu: string[]
const num = parseInput(10);      // Kiểu: number
```

### 5. Không Đặt Tham Số Optional Trong Callback Nếu Không Cần Thiết

```typescript
// ❌ BAD - Đánh dấu `index?: number` trong định nghĩa callback
interface CustomList<T> {
  forEach(callback: (item: T, index?: number) => void): void;
}
// Hệ quả: Người dùng mỗi lần dùng `index` đều bị bắt kiểm tra `index !== undefined`!

// ✅ GOOD - Luôn cung cấp `index: number` (người gọi có quyền bỏ qua tham số không dùng trong JS/TS)
interface GoodCustomList<T> {
  forEach(callback: (item: T, index: number) => void): void;
}
```

### 6. Định Kiểu `this` Parameter và Rest Parameters (`...args`)

```typescript
interface Button {
  label: string;
  disabled: boolean;
}

// Tham số `this` giả (fake parameter) đứng đầu tiên giúp kiểm soát ngữ cảnh gọi hàm
// (bị xóa bỏ hoàn toàn khi biên dịch sang JavaScript)
function handleClick(this: Button, eventType: string): void {
  console.log(`[${eventType}] Clicked button: ${this.label}`);
}

// Định kiểu Rest Parameters bằng mảng hoặc Tuple
function logMessages(prefix: string, ...messages: string[]): void {
  messages.forEach((msg) => console.log(`[${prefix}] ${msg}`));
}
```

---

## 🎓 Câu Hỏi Phỏng Vấn Thường Gặp / Common Interview Questions

### 1. Tại sao một hàm có kiểu `type Fn = () => void` lại cho phép return một số hoặc chuỗi?
- **Trả lời / Answer:** Để đảm bảo tính tương thích với các hàm bậc cao trong JavaScript (như `arr.forEach(x => result.push(x))`), khi một **kiểu hàm** (contextual function type) được khai báo trả về `void`, TypeScript hiểu là "giá trị trả về sẽ bị lờ đi" (ignored) và không cho phép nơi gọi sử dụng giá trị đó. Tuy nhiên, nếu bạn khai báo trực tiếp trên một hàm cụ thể `function f(): void { return 123; }`, TypeScript sẽ báo lỗi.

### 2. Sự khác nhau giữa `Parameters<T>` và `ReturnType<T>` là gì?
- **Trả lời / Answer:**
  - `Parameters<typeof myFunc>`: Trích xuất danh sách kiểu các tham số của hàm `myFunc` dưới dạng một **Tuple type** (ví dụ: `[id: string, count: number]`).
  - `ReturnType<typeof myFunc>`: Trích xuất kiểu dữ liệu trả về của hàm `myFunc`.

---

## 📚 Chủ Đề Liên Quan / Related Topics

- [Generics Snippet](../snippets/generics.ts)
- [Strict Mode](strict-mode.md)
- [Type vs Interface](../pitfalls/type-vs-interface.md)
