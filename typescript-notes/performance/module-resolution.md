# Module Resolution & Compiler Performance / Cơ Chế Phân Giải Module & Tối Ưu Biên Dịch

## 📖 Định Nghĩa / Definition

**Module Resolution** là quy trình mà trình biên dịch TypeScript (`tsc`) sử dụng để tìm ra file thực tế tương ứng với một câu lệnh `import` (ví dụ: `import { a } from "moduleA"` hoặc `import { b } from "./utils"`). Chọn đúng chiến lược phân giải module và cấu hình `tsconfig.json` ảnh hưởng trực tiếp đến tính tương thích hệ sinh thái và tốc độ kiểm tra kiểu (type-checking speed).

**Module Resolution** is the process the TypeScript compiler uses to figure out what an `import` refers to. Choosing the right `moduleResolution` strategy and compiler flags significantly impacts compatibility and build/type-check performance.

---

## 🧭 Các Chiến Lược `moduleResolution` Trong TypeScript / Resolution Strategies

| Giá trị `moduleResolution` | Khi nào sử dụng / Target Environment | Đặc điểm chính / Key Characteristics |
| --- | --- | --- |
| **`NodeNext`** / **`Node16`** | **Ứng dụng Backend Node.js** hoặc thư viện npm hiện đại | Tuân thủ chặt chẽ chuẩn ESM & CJS của Node.js; hỗ trợ `package.json` `"exports"`; **bắt buộc ghi đuôi `.js`** khi import tương đối trong ESM (`import { x } from "./foo.js"`). |
| **`Bundler`** *(TS 5.0+)* | **Frontend & Fullstack dùng Bundler** (Vite, Next.js, Webpack, Rollup, esbuild) | Hỗ trợ `package.json` `"exports"` & `"imports"` hiện đại, nhưng **không bắt buộc** ghi đuôi file `.js` khi import (`import { x } from "./foo"`). |
| **`Node`** (`Node10`) | Dự án cũ (Legacy) | Chỉ hiểu CommonJS cũ, **không** hỗ trợ trường `"exports"` trong `package.json` của các thư viện mới. |

### Tại sao với `NodeNext` ta lại viết `import { fn } from "./helper.js"` cho file `helper.ts`?
- **Giải thích:** TypeScript **không tự động viết lại (rewrite)** đường dẫn import khi biên dịch từ `.ts` sang `.js`. Vì môi trường chạy thực tế của Node.js ESM yêu cầu đường dẫn đầy đủ tới file `.js` sau khi build, TypeScript cho phép bạn viết `./helper.js` ngay trong file `.ts` và tự động tìm sang file nguồn `./helper.ts` để kiểm tra kiểu!

---

## ⚡ Tối Ưu Tốc Độ Biên Dịch & Kiểm Tra Kiểu / Optimizing TypeScript Performance

Khi dự án lớn dần, lệnh `tsc --noEmit` hoặc gợi ý trong IDE (VS Code) có thể bị chậm. Dưới đây là các kỹ thuật tối ưu quan trọng nhất:

### 1. Bật `incremental` và `skipLibCheck` Trong `tsconfig.json`

```jsonc
{
  "compilerOptions": {
    // 1. Lưu đồ thị biên dịch lần trước vào file .tsbuildinfo để chỉ kiểm tra các file thay đổi
    "incremental": true,

    // 2. Bỏ qua kiểm tra chéo bên trong các file .d.ts của node_modules (vẫn kiểm tra code của bạn với .d.ts!)
    // Giúp giảm 40% - 70% thời gian chạy tsc!
    "skipLibCheck": true,

    // 3. Cho phép các công cụ như Vite/esbuild/swc biên dịch từng file độc lập cực nhanh
    "isolatedModules": true
  },
  // 4. Giới hạn rõ phạm vi thư mục cần kiểm tra, tránh quét nhầm thư mục build/dist
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "build", "coverage"]
}
```

### 2. Sử Dụng Project References (`composite: true`) Cho Monorepo

Thay vì dùng một `tsconfig.json` khổng lồ cho toàn bộ dự án lớn, hãy chia nhỏ thành các package/sub-project (`packages/shared`, `packages/api`, `packages/web`) với `"composite": true` và biên dịch bằng `tsc --build` (`tsc -b`):

```jsonc
// tsconfig.json ở thư mục gốc
{
  "files": [],
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/api" },
    { "path": "./packages/web" }
  ]
}
```

### 3. Viết Kiểu Thân Thiện Với Trình Biên Dịch / Writing Compiler-Friendly Types

1. **Ưu tiên `interface extends` hơn `type` với nhiều phép giao `&` phức tạp:**
   - `interface` tạo ra bảng thuộc tính phẳng được TypeScript cache theo tên, trong khi `A & B & C` phải tính toán đệ quy mỗi lần so sánh.
2. **Khai báo rõ kiểu trả về cho các hàm được export (`explicit return types`):**
   - Giúp TypeScript không phải đọc toàn bộ thân hàm phức tạp chỉ để suy luận kiểu cho các file khác đang import hàm đó (đặc biệt hiệu quả với cờ `"isolatedDeclarations": true` từ TS 5.5+).
3. **Tránh lạm dụng Conditional Types và Template Literal Types đệ quy quá sâu:**
   - Một kiểu Template Literal kết hợp nhiều Union lớn (`${A}-${B}-${C}`) có thể sinh ra hàng chục nghìn tổ hợp gây lỗi `Expression produces a union type that is too complex to represent`.

### 4. Chẩn Đoán Nguyên Nhân Chậm Bằng `--extendedDiagnostics` & `--generateTrace`

```bash
# 1. Xem thống kê thời gian I/O, Parse, Bind, Check, Emit của tsc:
npx tsc --noEmit --extendedDiagnostics

# 2. Xuất file trace để mở trong chrome://tracing hoặc công cụ @typescript/analyze-trace:
npx tsc --noEmit --generateTrace ./ts-trace
```

---

## 🎓 Câu Hỏi Phỏng Vấn Thường Gặp / Common Interview Questions

### 1. Cờ `"skipLibCheck": true` có làm mất an toàn kiểu khi gọi thư viện trong `node_modules` không?
- **Trả lời / Answer:** **Không.** Khi bật `skipLibCheck: true`, TypeScript vẫn kiểm tra chặt chẽ **code của bạn** so với các file khai báo kiểu (`.d.ts`) mà bạn import từ `node_modules`. Nó chỉ bỏ qua việc kiểm tra nội bộ toàn bộ các file `.d.ts` không liên quan hoặc xung đột giữa hai thư viện khác nhau trong `node_modules`, nhờ đó tăng tốc độ biên dịch đáng kể.

### 2. Khi nào chọn `"moduleResolution": "Bundler"` và khi nào chọn `"NodeNext"`?
- **Trả lời / Answer:**
  - Chọn **`"Bundler"`** khi code của bạn luôn đi qua một công cụ đóng gói (Vite, Next.js, Webpack, Rollup, esbuild) trước khi chạy — bạn được phép viết `import { x } from "./utils"` không cần đuôi `.js` mà vẫn hỗ trợ `package.json` `"exports"`.
  - Chọn **`"NodeNext"`** khi viết ứng dụng/thư viện chạy trực tiếp trên Node.js bằng `tsc` mà không qua bundler.

---

## 📚 Chủ Đề Liên Quan / Related Topics

- [Tree Shaking](tree-shaking.md)
- [Strict Mode](../best-practices/strict-mode.md)
- [Type vs Interface](../pitfalls/type-vs-interface.md)
