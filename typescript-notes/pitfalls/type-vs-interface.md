# `type` vs `interface` / Phân Biệt `type` và `interface`

## 📖 Định Nghĩa / Definition

Trong TypeScript, cả **`interface`** và **`type`** (Type Alias) đều được dùng để định nghĩa hình dạng của một đối tượng (object shape) hoặc cấu trúc dữ liệu. Tuy nhiên, chúng có những điểm khác biệt quan trọng về khả năng mở rộng, biểu diễn kiểu nâng cao và hành vi khi biên dịch.

In TypeScript, both **`interface`** and **`type`** (Type Alias) are used to describe object shapes and data structures. However, they differ in extensibility, advanced type expressiveness, and declaration merging behavior.

---

## 📊 Bảng So Sánh Chi Tiết / Detailed Comparison

| Tính năng / Feature | `interface` | `type` (Type Alias) |
| --- | --- | --- |
| Mô tả Object / Function / Class | ✅ Có / Yes | ✅ Có / Yes |
| Kế thừa / Mở rộng (Extend / Intersect) | `extends` | `&` (Intersection) |
| Class `implements` | ✅ Có / Yes | ✅ Có (trừ Union type) / Yes (except Union) |
| **Declaration Merging** (Gộp khai báo trùng tên) | ✅ **Có / Supported** | ❌ **Không / Duplicate identifier error** |
| Định nghĩa **Primitive, Union, Tuple** | ❌ Không trực tiếp / No | ✅ **Có / Supported** (`type ID = string \| number`) |
| Mapped Types (`[K in keyof T]`) | ❌ Không / No | ✅ **Có / Supported** |
| Conditional Types (`T extends U ? X : Y`) | ❌ Không / No | ✅ **Có / Supported** |
| Hiệu năng kiểm tra kiểu / Compiler Performance | 🟢 Nhanh hơn khi kế thừa phẳng (`extends`) | 🟡 Intersection `&` phức tạp có thể chậm hơn |

---

## 📝 Ví Dụ Minh Họa / Code Examples

### 1. Kế Thừa (`extends`) vs Giao (`&` Intersection)

```typescript
// Dùng interface với extends
interface Animal {
  name: string;
}

interface Dog extends Animal {
  breed: string;
}

// Dùng type với intersection (&)
type Vehicle = {
  brand: string;
};

type Car = Vehicle & {
  doors: number;
};

// Kết hợp cả hai đều được!
interface ElectricCar extends Car {
  batteryCapacity: number;
}
```

### 2. Điểm Khác Biệt Quan Trọng Khi Xung Đột Thuộc Tính / Property Conflict Pitfall

Khi hai thuộc tính trùng tên nhưng khác kiểu, `interface extends` và `type &` xử lý **hoàn toàn khác nhau**:

```typescript
// 1. Với interface: Báo lỗi ngay lúc khai báo!
interface PersonA {
  id: number;
}

// ❌ Compile Error: Interface 'StaffA' incorrectly extends interface 'PersonA'.
// Types of property 'id' are incompatible.
interface StaffA extends PersonA {
  id: string;
}

// 2. Với type intersection (&): KHÔNG báo lỗi lúc khai báo, nhưng gộp thành `never`!
type PersonB = { id: number };
type StaffB = PersonB & { id: string };

// Khi sử dụng mới phát hiện id có kiểu `number & string` = `never`!
const staff: StaffB = {
  id: 123, // ❌ Error: Type 'number' is not assignable to type 'never'
};
```

### 3. Declaration Merging (Chỉ `interface` mới có)

Tính năng này cực kỳ hữu ích khi bạn muốn mở rộng kiểu của thư viện bên thứ 3 (như `express`, `window`):

```typescript
// Khai báo lần 1
interface User {
  id: number;
  name: string;
}

// Khai báo lần 2 - TypeScript tự động gộp cả hai!
interface User {
  email: string;
}

const u: User = {
  id: 1,
  name: "Alice",
  email: "alice@example.com", // Bắt buộc có cả 3 thuộc tính
};

// Ví dụ thực tế: Mở rộng đối tượng Window của trình duyệt
declare global {
  interface Window {
    analyticsClient?: {
      track: (event: string) => void;
    };
  }
}
```

Nếu dùng `type User = ...` hai lần trong cùng một scope, TypeScript sẽ báo lỗi: `Duplicate identifier 'User'`.

### 4. Các Trường Hợp Chỉ `type` Mới Làm Được / Exclusive to `type`

```typescript
// 1. Union Types (Kiểu hợp) & Discriminated Unions
type Status = "idle" | "loading" | "success" | "error";

type ApiResponse<T> =
  | { status: "success"; data: T }
  | { status: "error"; message: string };

// 2. Tuple Types (Mảng cố định số lượng và kiểu phần tử)
type Coordinates = [latitude: number, longitude: number];

// 3. Mapped Types & Template Literal Types
type ReadonlyModel<T> = {
  readonly [K in keyof T]: T[K];
};

type EventName = `on${"Click" | "Hover" | "Focus"}`; // "onClick" | "onHover" | "onFocus"
```

---

## 💡 Khi Nào Nên Dùng Cái Nào? / Best Practices & Guidelines

### ✅ Dùng `interface` khi:
1. Định nghĩa hình dạng **Object**, **Class contract**, hoặc **Public API** của thư viện.
2. Cần tính năng **Declaration Merging** (ví dụ: augment `Express.Request`, `Window`, module bên thứ 3).
3. Xây dựng cây kế thừa đối tượng lớn (`interface A extends B, C` giúp TypeScript cache kiểu tốt hơn và báo lỗi rõ ràng hơn so với `A & B & C`).

### ✅ Dùng `type` khi:
1. Cần định nghĩa **Union Types** (`string | number`), **Discriminated Unions**, hoặc **Tuples**.
2. Sử dụng **Mapped Types**, **Conditional Types**, hoặc biến đổi kiểu với Utility Types (`Pick`, `Omit`, `ReturnType`).
3. Đặt bí danh cho kiểu nguyên thủy có ngữ nghĩa (`type UserId = string`).
4. Không muốn cho phép người khác vô tình gộp khai báo (Declaration Merging).

---

## 🎓 Câu Hỏi Phỏng Vấn Thường Gặp / Common Interview Questions

### 1. Sự khác biệt lớn nhất giữa `type` và `interface` là gì? / What are the key differences between `type` and `interface`?
- **Trả lời / Answer:**
  1. **Declaration Merging:** `interface` cho phép khai báo nhiều lần cùng tên để tự động gộp thuộc tính; `type` sẽ báo lỗi trùng tên.
  2. **Khả năng biểu diễn:** `type` biểu diễn được Union (`A | B`), Tuple (`[number, string]`), Primitive alias, Mapped/Conditional types; `interface` chỉ mô tả được Object/Function/Index signatures.
  3. **Xung đột khi mở rộng:** `interface extends` báo lỗi ngay khi ghi đè thuộc tính không tương thích; `type &` âm thầm biến thuộc tính xung đột thành kiểu `never`.

### 2. Một `class` có thể `implements` một `type` không? / Can a class implement a `type`?
- **Trả lời / Answer:** **Có**, miễn là `type` đó biểu diễn một hình dạng đối tượng tĩnh (object type hoặc intersection của các object types). Tuy nhiên, một `class` **không thể** `implements` một `type` là **Union Type** (ví dụ: `type Shape = Circle | Square`).

### 3. Về mặt hiệu năng trình biên dịch (TypeScript compiler performance), cái nào tốt hơn?
- **Trả lời / Answer:** Theo tài liệu chính thức của Microsoft TypeScript Wiki, `interface` với `extends` có hiệu năng tốt hơn một chút so với `type` dùng nhiều phép giao `&` (Intersection), vì TypeScript tạo ra cấu trúc phẳng dễ cache hơn và phát hiện xung đột kiểu sớm hơn.

---

## 📚 Chủ Đề Liên Quan / Related Topics

- [Any vs Unknown](any-vs-unknown.md)
- [Typing Functions](../best-practices/typing-functions.md)
- [Generics Snippet](../snippets/generics.ts)
