# Tree Shaking & Bundle Size Optimization / Tối Ưu Tree Shaking Trong TypeScript

## 📖 Định Nghĩa / Definition

**Tree Shaking** (Lắc cây rụng lá khô) là kỹ thuật loại bỏ các đoạn mã không được sử dụng (**Dead-Code Elimination**) trong quá trình đóng gói (bundling với Webpack, Rollup, Vite, esbuild). Nó dựa trên cấu trúc tĩnh của **ES Modules (`import` / `export`)** để phát hiện những hàm, biến hoặc kiểu không bao giờ được gọi tới và loại bỏ chúng khỏi file bundle cuối cùng.

**Tree Shaking** is a dead-code elimination technique used by modern bundlers (Vite, Rollup, Webpack, esbuild) that relies on the static structure of **ES Modules (`import` / `export`)** to strip unused code from the final production bundle.

---

## 🔴 Các Nguyên Nhân Làm Hỏng Tree Shaking Trong TypeScript / Common Pitfalls

### 1. Dùng `enum` Thường Thay Vì `const enum` Hoặc Union + `as const`

`enum` thông thường trong TypeScript khi biên dịch sang JavaScript sẽ tạo ra một **IIFE (Immediately Invoked Function Expression)**. Nhiều bundler không dám xóa IIFE này vì sợ có side-effect!

```typescript
// ❌ CẨN THẬN - Enum thường sinh ra một hàm IIFE lúc runtime
export enum Role {
  Admin = "ADMIN",
  User = "USER",
}
// Biên dịch ra JS:
// var Role; (function (Role) { Role["Admin"] = "ADMIN"; ... })(Role || (Role = {}));

// ✅ TỐT HƠN - Dùng Object `as const` + Union Type (Tree-shakeable 100%, chuẩn JS)
export const Role = {
  Admin: "ADMIN",
  User: "USER",
} as const;

export type Role = (typeof Role)[keyof typeof Role];
```

### 2. Quên Dùng `import type` / `export type`

Nếu bạn import một class hoặc module chỉ để làm **kiểu dữ liệu (Type Annotation)** mà không dùng từ khóa `type`, một số công cụ biên dịch đơn lẻ (như Babel, `swc`, `esbuild` với `isolatedModules`) có thể giữ lại câu lệnh `import` rỗng và kéo theo side-effects của module đó vào bundle!

```typescript
// ❌ BAD - Có nguy cơ giữ lại import của module nặng chỉ để lấy kiểu
import { HeavyChartComponent, ChartOptions } from "./heavy-chart";

export function configureChart(options: ChartOptions) {
  return options;
}

// ✅ GOOD - Dùng `import type` đảm bảo bị xóa sạch 100% khi biên dịch sang JS!
import type { ChartOptions } from "./heavy-chart";
// Hoặc inline type import (TypeScript 4.5+):
import { renderChart, type ChartTheme } from "./heavy-chart";
```

> **💡 Mẹo cấu hình `tsconfig.json`:** Bật `"verbatimModuleSyntax": true` (TypeScript 5.0+) để bắt buộc mọi import chỉ dùng làm kiểu đều phải ghi rõ `import type`.

### 3. Lạm Dụng Barrel Files (`index.ts`) / Barrel File Pitfall

**Barrel file** là file `index.ts` dùng để gom và `export *` từ hàng chục file con. Khi dự án lớn:
1. Chỉ import 1 hàm nhỏ từ `./utils/index.ts` có thể khiến bundler hoặc test runner (Jest/Vitest) phải tải và phân tích toàn bộ 50 file còn lại trong thư mục.
2. Dễ gây lỗi **Circular Dependency** (phụ thuộc vòng).

```typescript
// ❌ AVOID trong các thư mục lớn - Barrel file re-export mọi thứ
// src/components/index.ts
export * from "./HeavyDataGrid";
export * from "./RichTextEditor";
export * from "./SimpleButton";

// ✅ GOOD - Import trực tiếp từ đường dẫn cụ thể hoặc tách entry points trong package.json
import { SimpleButton } from "./components/SimpleButton";
```

### 4. Dùng `export default { ... }` Thay Vì Named Exports

Khi bạn gom nhiều hàm vào một object trong `export default`, bundler rất khó loại bỏ từng hàm không dùng bên trong object đó:

```typescript
// ❌ BAD - Gom vào 1 object default export làm giảm hiệu quả Tree Shaking
export default {
  formatDate() { /* ... */ },
  formatCurrency() { /* ... */ },
  heavyPdfExport() { /* ... */ }, // Vẫn bị打包 vào bundle dù chỉ gọi formatDate()!
};

// ✅ GOOD - Dùng Named Exports riêng lẻ
export function formatDate() { /* ... */ }
export function formatCurrency() { /* ... */ }
export function heavyPdfExport() { /* ... */ }
```

---

## ⚙️ Cấu Hình Để Tối Ưu Tree Shaking / Configuration Checklist

1. **`tsconfig.json`**:
   - `"module": "ESNext"` (hoặc `"ES2022"` khi dùng với bundler như Vite/Webpack để giữ nguyên cú pháp ESM `import`/`export` thay vì biên dịch sang CommonJS `require()`).
   - `"verbatimModuleSyntax": true` để ép tách biệt `import type`.
2. **`package.json`**:
   - Thêm `"sideEffects": false` (hoặc liệt kê các file CSS: `"sideEffects": ["**/*.css"]`) để báo cho Webpack/Rollup/Vite biết có thể xóa an toàn bất kỳ file nào không được dùng.

---

## 🎓 Câu Hỏi Phỏng Vấn Thường Gặp / Common Interview Questions

### 1. Tại sao CommonJS (`require` / `module.exports`) không hỗ trợ Tree Shaking tốt như ES Modules (`import` / `export`)?
- **Trả lời / Answer:**
  - **ES Modules (ESM)** có cấu trúc **tĩnh (static)**: các câu lệnh `import`/`export` phải nằm ở cấp cao nhất (top-level) và tên module là chuỗi cố định, cho phép bundler phân tích đồ thị phụ thuộc ngay lúc **build-time** mà không cần chạy code.
  - **CommonJS (CJS)** có tính **động (dynamic)**: `require()` là một hàm có thể gọi bên trong câu lệnh `if`, hoặc nối chuỗi tên biến lúc **runtime** (`require('./lang/' + userLang)`), nên bundler không thể biết chắc nhánh code nào sẽ không bao giờ được gọi.

### 2. Cờ `"verbatimModuleSyntax": true` trong TypeScript 5.0+ giải quyết vấn đề gì?
- **Trả lời / Answer:** Nó thay thế các cờ cũ khó hiểu (`importsNotUsedAsValues`, `preserveValueImports`) bằng một quy tắc đơn giản: bất kỳ import/export nào **không có** từ khóa `type` sẽ được giữ nguyên trong file JavaScript đầu ra; bất kỳ import/export nào **có** từ khóa `type` (`import type { A }`) sẽ bị xóa hoàn toàn. Điều này giúp tránh việc vô tình giữ lại các module nặng trong bundle.

---

## 📚 Chủ Đề Liên Quan / Related Topics

- [Module Resolution](module-resolution.md)
- [Strict Mode](../best-practices/strict-mode.md)
