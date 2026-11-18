# `null` vs `undefined` / Xử Lý `null` và `undefined` Trong TypeScript

## 📖 Định Nghĩa / Definition

JavaScript và TypeScript có hai kiểu dữ liệu biểu thị sự "vắng mặt của giá trị":

- **`undefined`**: Biến đã được khai báo nhưng **chưa được gán giá trị**, thuộc tính không tồn tại trên object, hoặc hàm không `return` giá trị cụ thể. (Mang ý nghĩa: *chưa được khởi tạo / không tìm thấy*).
- **`null`**: Giá trị được gán **một cách chủ đích** bởi lập trình viên để biểu thị "trống rỗng" hoặc "không có đối tượng". (Mang ý nghĩa: *cố tình để trống*).

JavaScript and TypeScript have two primitive values used to signal an absent or uninitialized value:

- **`undefined`**: A variable has been declared but **not yet assigned a value**, a missing object property, or an omitted optional parameter. (*Uninitialized / missing*).
- **`null`**: An **explicitly assigned** value representing "no value" or "empty object reference". (*Intentional absence of value*).

---

## 📊 So Sánh Nhanh / Quick Comparison

| Đặc điểm / Feature | `undefined` | `null` |
| --- | --- | --- |
| Kết quả `typeof` | `"undefined"` | `"object"` (lỗi lịch sử của JS / historical JS bug) |
| So sánh lỏng (`null == undefined`) | `true` | `true` |
| So sánh chặt (`null === undefined`) | `false` | `false` |
| `JSON.stringify({ a: undefined, b: null })` | Bị lược bỏ key `a` (`'{"b":null}'`) | Giữ nguyên key `b` với giá trị `null` |
| Default Parameter `fn(x = 10)` | Kích hoạt giá trị mặc định (`10`) | **Không** kích hoạt (nhận giá trị `null`) |

---

## 🔴 Các Bẫy Thường Gặp / Common Pitfalls

### 1. Bẫy Default Parameter với `null` / Default Parameters Pitfall

Default parameter trong JS/TS **chỉ** kích hoạt khi đối số là `undefined`, không kích hoạt khi truyền `null`!

```typescript
function greet(name: string | null = "Guest") {
  // ❌ Nếu truyền null, name sẽ là null chứ không phải "Guest"!
  console.log(`Hello, ${name?.toUpperCase()}`);
}

greet(undefined); // "Hello, GUEST"
greet(null);      // "Hello, undefined" (vì name là null!)
```

### 2. Bẫy Toán Tử `||` vs `??` (Nullish Coalescing)

Toán tử `||` kiểm tra **falsy** (`0`, `""`, `false`, `NaN`, `null`, `undefined`), rất dễ làm mất giá trị hợp lệ `0` hoặc chuỗi rỗng `""`:

```typescript
interface PaginationOptions {
  page?: number;
  limit?: number;
  searchQuery?: string;
}

function setupPagination(options: PaginationOptions) {
  // ❌ BAD - Nếu truyền limit = 0 hoặc searchQuery = "", toán tử || sẽ ghi đè!
  const badLimit = options.limit || 20;           // 0 -> 20 (SAI!)
  const badQuery = options.searchQuery || "all";  // "" -> "all" (SAI!)

  // ✅ GOOD - Toán tử ?? chỉ fallback khi giá trị là null hoặc undefined
  const goodLimit = options.limit ?? 20;          // 0 -> 0 (ĐÚNG!)
  const goodQuery = options.searchQuery ?? "all"; // "" -> "" (ĐÚNG!)
}
```

### 3. Lạm Dụng Non-Null Assertion (`!`) / Overusing `!`

Toán tử `!` (`user!.name`) chỉ bảo TypeScript "đừng báo lỗi nữa", hoàn toàn không kiểm tra lúc runtime:

```typescript
interface User {
  profile?: {
    avatarUrl?: string;
  };
}

function getAvatar(user?: User) {
  // ❌ BAD - Dùng ! có thể gây crash runtime nếu user hoặc profile là undefined
  // return user!.profile!.avatarUrl!;

  // ✅ GOOD - Dùng Optional Chaining (?.) kết hợp Nullish Coalescing (??)
  return user?.profile?.avatarUrl ?? "/assets/default-avatar.png";
}
```

### 4. `optional property` (`x?: string`) vs `string | undefined` (`exactOptionalPropertyTypes`)

```typescript
interface UpdateUserDto {
  name?: string;          // Có thể bỏ qua thuộc tính `name`
  bio: string | undefined; // Bắt buộc phải có key `bio`, dù giá trị là undefined
}

// ✅ Hợp lệ: bỏ qua name, nhưng phải truyền key bio
const dto1: UpdateUserDto = { bio: undefined };

// ❌ Lỗi Compile: Property 'bio' is missing
// const dto2: UpdateUserDto = { name: "Nam" };
```

---

## 🛠️ Kỹ Thuật Lọc `null` / `undefined` Khỏi Mảng / Filtering Nullish Values

Khi dùng `.filter(Boolean)` trong TypeScript (trước TS 5.5), kiểu của mảng không tự động loại bỏ `null | undefined`. Bạn có thể dùng Type Guard:

```typescript
const rawItems: Array<string | null | undefined> = ["TS", null, "JS", undefined];

// Cách chuẩn với Type Predicate (hoạt động trên mọi phiên bản TS)
function isNotNullish<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

const validItems: string[] = rawItems.filter(isNotNullish); // Kiểu: string[]
```

---

## 🎓 Câu Hỏi Phỏng Vấn Thường Gặp / Common Interview Questions

### 1. Sự khác nhau giữa `?.` (Optional Chaining) và `!` (Non-null Assertion) là gì?
- **Trả lời / Answer:**
  - `?.` là tính năng của **JavaScript runtime** và TypeScript: nếu giá trị phía trước là `null` hoặc `undefined`, biểu thức dừng lại ngay lập tức và trả về `undefined` thay vì ném lỗi.
  - `!` là cú pháp **chỉ có ở TypeScript lúc compile** (bị xóa bỏ khi biên dịch sang JS): nó ép trình biên dịch bỏ qua khả năng `null | undefined`. Nếu giá trị thực tế lúc runtime là `null`, ứng dụng sẽ bị crash.

### 2. Sự khác nhau giữa `||` (Logical OR) và `??` (Nullish Coalescing) là gì?
- **Trả lời / Answer:** `a || b` trả về `b` nếu `a` là bất kỳ giá trị **falsy** nào (`false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`). Trong khi đó, `a ?? b` chỉ trả về `b` khi `a` là **nullish** (`null` hoặc `undefined`), giữ nguyên các giá trị hợp lệ như `0`, `false`, hoặc `""`.

### 3. Khi làm việc với JSON API, `null` và `undefined` khác nhau thế nào?
- **Trả lời / Answer:** Chuẩn JSON không hỗ trợ kiểu `undefined`. Khi gọi `JSON.stringify()`, các thuộc tính object có giá trị `undefined` sẽ bị **xóa bỏ hoàn toàn** khỏi payload, còn thuộc tính có giá trị `null` sẽ được giữ lại dưới dạng `"field": null` (thường dùng trong REST API PATCH để báo hiệu xóa dữ liệu của một trường trong DB).

---

## 📚 Chủ Đề Liên Quan / Related Topics

- [Strict Mode (`strictNullChecks`)](../best-practices/strict-mode.md)
- [Any vs Unknown](any-vs-unknown.md)
