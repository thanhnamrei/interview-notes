# Strict Mode (`tsconfig.json`) / Chế Độ Nghiêm Ngặt Trong TypeScript

## 📖 Định Nghĩa / Definition

**`"strict": true`** trong `tsconfig.json` là một cờ tổng hợp (umbrella flag) giúp bật toàn bộ các quy tắc kiểm tra kiểu nghiêm ngặt nhất của TypeScript. Đây là cấu hình **bắt buộc** trong hầu hết các dự án TypeScript chuyên nghiệp để phát hiện lỗi ngay lúc biên dịch thay vì lúc chạy (runtime).

**`"strict": true`** in `tsconfig.json` enables a wide range of type checking behavior that results in stronger guarantees of program correctness. Turning this on is equivalent to enabling all of the strict mode family options.

---

## ⚙️ Các Cờ Thành Phần Trong `"strict": true` / Strict Family Flags

Khi bật `"strict": true`, TypeScript tự động bật tất cả các cờ sau:

| Cờ / Compiler Flag | Ý nghĩa / What It Does |
| --- | --- |
| **`noImplicitAny`** | Cấm các biến hoặc tham số tự động mang kiểu `any` ngầm định khi không ghi chú kiểu và TS không suy luận được. |
| **`strictNullChecks`** | Tách biệt `null` và `undefined` ra khỏi các kiểu dữ liệu thông thường (`string`, `number`, object...). |
| **`strictFunctionTypes`** | Kiểm tra tính tương thích của tham số hàm theo quy tắc **Contravariance** (nghiêm ngặt hơn Bivariance mặc định). |
| **`strictBindCallApply`** | Kiểm tra đúng kiểu đối số khi gọi các phương thức `.bind()`, `.call()`, và `.apply()`. |
| **`strictPropertyInitialization`** | Bắt buộc các thuộc tính trong `class` phải được khởi tạo tại nơi khai báo hoặc trong `constructor`. |
| **`noImplicitThis`** | Báo lỗi khi từ khóa `this` có kiểu ngầm định là `any`. |
| **`useUnknownInCatchVariables`** | Đặt kiểu mặc định cho biến `err` trong `catch (err)` là `unknown` thay vì `any`. |
| **`alwaysStrict`** | Phát sinh chỉ thị `"use strict"` ở đầu mỗi file JS biên dịch ra và phân tích cú pháp theo ECMAScript strict mode. |

---

## 📝 Ví Dụ Chi Tiết Từng Cờ Quan Trọng / Key Flag Examples

### 1. `noImplicitAny`

```typescript
// ❌ Lỗi khi bật noImplicitAny:
// Parameter 'price' implicitly has an 'any' type.
function calculateTax(price) {
  return price * 0.1;
}

// ✅ Sửa: Khai báo kiểu rõ ràng
function calculateTaxSafe(price: number): number {
  return price * 0.1;
}
```

### 2. `strictNullChecks`

Nếu tắt cờ này, mọi kiểu dữ liệu đều ngầm chấp nhận `null` và `undefined` (nguyên nhân số 1 gây lỗi *"Billion Dollar Mistake"*):

```typescript
interface User {
  id: number;
  name: string;
}

function findUser(id: number): User | undefined {
  return id === 1 ? { id: 1, name: "Alice" } : undefined;
}

const user = findUser(2);

// ❌ Lỗi khi bật strictNullChecks: 'user' is possibly 'undefined'
// console.log(user.name);

// ✅ Phải kiểm tra hoặc dùng Optional Chaining
if (user) {
  console.log(user.name);
}
```

### 3. `strictPropertyInitialization`

```typescript
class UserService {
  // ❌ Lỗi: Property 'dbConnection' has no initializer and is not definitely assigned in the constructor.
  // private dbConnection: string;

  // ✅ Cách 1: Khởi tạo trong constructor
  private readonly apiUrl: string;

  // ✅ Cách 2: Dùng Definite Assignment Assertion (!) chỉ khi được khởi tạo qua lifecycle method (vd: NestJS / Angular ngOnInit)
  private lateInitService!: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }
}
```

### 4. `strictFunctionTypes` (Contravariance cho tham số hàm)

```typescript
interface Animal {
  name: string;
}
interface Dog extends Animal {
  bark(): void;
}

type AnimalHandler = (animal: Animal) => void;
type DogHandler = (dog: Dog) => void;

const handleDog: DogHandler = (dog) => dog.bark();

// ❌ Lỗi khi bật strictFunctionTypes!
// Nếu cho phép gán handleDog vào handleAnimal, khi truyền Cat (cũng là Animal) vào handleAnimal sẽ gọi .bark() và crash!
// const handleAnimal: AnimalHandler = handleDog;
```

---

## 🛡️ Các Cờ Bổ Sung Nên Bật Ngoài `"strict": true` / Extra Recommended Flags

Dù đã bật `"strict": true`, một số cờ cực kỳ hữu ích sau **chưa nằm trong** gói `strict` mặc định và bạn nên chủ động bật thêm trong dự án mới:

```jsonc
// tsconfig.json chuẩn cho dự án Production
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",

    // 1. Bật toàn bộ gói strict chuẩn
    "strict": true,

    // 2. Các cờ an toàn bổ sung cực kỳ quan trọng
    "noUncheckedIndexedAccess": true,       // Mảng/Record trả về T | undefined khi truy cập qua index (arr[0])
    "exactOptionalPropertyTypes": true,     // Phân biệt rõ { a?: string } và { a: string | undefined }
    "noImplicitOverride": true,             // Bắt buộc từ khóa `override` khi ghi đè method của class cha
    "noFallthroughCasesInSwitch": true,     // Chặn quên `break` hoặc `return` trong switch-case
    "noImplicitReturns": true,              // Mọi nhánh code trong hàm đều phải return đồng nhất
    "noUnusedLocals": true,                 // Báo lỗi biến khai báo nhưng không dùng
    "noUnusedParameters": true,             // Báo lỗi tham số không dùng (trừ khi bắt đầu bằng `_`)
    "forceConsistentCasingInFileNames": true // Tránh lỗi phân biệt hoa/thường giữa macOS/Windows và Linux
  }
}
```

### Tại sao `noUncheckedIndexedAccess` lại quan trọng?

```typescript
const users: string[] = ["Alice", "Bob"];

// Khi KHÔNG bật noUncheckedIndexedAccess:
// thirdUser có kiểu `string` (dù thực tế là undefined!) -> Gọi .toUpperCase() sẽ crash!

// Khi BẬT noUncheckedIndexedAccess: true
const thirdUser = users[2]; // Kiểu tự động là: string | undefined
if (thirdUser !== undefined) {
  console.log(thirdUser.toUpperCase()); // An toàn tuyệt đối!
}
```

---

## 🎓 Câu Hỏi Phỏng Vấn Thường Gặp / Common Interview Questions

### 1. Làm thế nào để bật dần `"strict": true` cho một dự án cũ (Legacy Codebase) hàng nghìn file?
- **Trả lời / Answer:**
  1. Không bật `"strict": true` ngay lập tức để tránh hàng nghìn lỗi cùng lúc.
  2. Bật từng cờ nhỏ theo thứ tự từ dễ đến khó: `alwaysStrict` -> `noImplicitThis` -> `strictBindCallApply` -> `strictFunctionTypes` -> `noImplicitAny` -> cuối cùng là `strictNullChecks`.
  3. Hoặc sử dụng một file `tsconfig.strict.json` riêng cho các thư mục/module mới viết và thêm dần các file đã refactor vào danh sách kiểm tra.

### 2. Tại sao truy cập `arr[100]` trong TypeScript mặc định không báo lỗi có thể là `undefined` dù đã bật `strict: true`?
- **Trả lời / Answer:** Vì lý do hiệu năng và sự tiện lợi trong các vòng lặp `for (let i = 0; i < arr.length; i++)`, `"strict": true` không bao gồm kiểm tra truy cập phần tử qua chỉ mục. Để TypeScript suy luận `arr[i]` và `record[key]` có kiểu `T | undefined`, bạn phải bật thêm cờ `"noUncheckedIndexedAccess": true`.

---

## 📚 Chủ Đề Liên Quan / Related Topics

- [Any vs Unknown](../pitfalls/any-vs-unknown.md)
- [Null vs Undefined](../pitfalls/null-undefined.md)
- [Module Resolution](../performance/module-resolution.md)
