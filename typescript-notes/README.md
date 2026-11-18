# TypeScript Interview Notes / Ghi Chú Phỏng Vấn TypeScript

Tài liệu tổng hợp kiến thức, lỗi thường gặp (pitfalls), quy tắc viết code (best practices), design patterns và tối ưu hiệu năng TypeScript để chuẩn bị cho phỏng vấn kỹ thuật (Junior → Senior).

A comprehensive bilingual TypeScript knowledge base covering common pitfalls, best practices, code snippets, design patterns, and performance optimization for technical interview preparation.

---

## 📁 Cấu Trúc Thư Mục / Directory Structure

```text
typescript-notes/
│── README.md                 # Giới thiệu repo / Overview & Navigation
│── pitfalls/                 # Các vấn đề & bẫy thường gặp / Common Pitfalls
│   ├── any-vs-unknown.md
│   ├── type-vs-interface.md
│   ├── null-undefined.md
│   └── promise-handling.md
│── best-practices/           # Các quy tắc viết code / Best Practices
│   ├── strict-mode.md
│   ├── typing-functions.md
│   └── naming-conventions.md
│── snippets/                 # Đoạn code mẫu thực tế / Code Snippets
│   ├── generics.ts
│   ├── async-await.ts
│   └── decorator-example.ts
│── design-patterns/          # Design Patterns với TypeScript
│   ├── singleton.md
│   ├── factory.md
│   └── observer.md
│── performance/              # Tối ưu & lưu ý hiệu năng / Performance
│   ├── tree-shaking.md
│   ├── module-resolution.md
│   └── memory-leaks.md
└── references.md             # Tài liệu & blog hay / Curated References
```

---

## 📚 Nội Dung Chi Tiết / Detailed Contents

### 1. [pitfalls/](pitfalls/) — Các Vấn Đề & Bẫy Thường Gặp / Common Pitfalls

- **[any-vs-unknown.md](pitfalls/any-vs-unknown.md)**: Phân biệt `any`, `unknown`, `never`; kỹ thuật Type Narrowing, Custom Type Guards (`x is T`), và Exhaustive Check.
- **[type-vs-interface.md](pitfalls/type-vs-interface.md)**: So sánh `type` và `interface`, Declaration Merging, xung đột thuộc tính (`never`), Union/Mapped types.
- **[null-undefined.md](pitfalls/null-undefined.md)**: Khác biệt giữa `null` và `undefined`, bẫy `||` vs `??`, Optional Chaining (`?.`) vs Non-null Assertion (`!`), hành vi với `JSON.stringify`.
- **[promise-handling.md](pitfalls/promise-handling.md)**: Lỗi quên `return await` trong `try/catch`, bẫy `async` trong `.forEach()`, Sequential Waterfall, `Promise.all` vs `Promise.allSettled`, và `Awaited<T>`.

### 2. [best-practices/](best-practices/) — Các Quy Tắc Viết Code Chuẩn / Best Practices

- **[strict-mode.md](best-practices/strict-mode.md)**: Ý nghĩa 8 cờ trong `"strict": true` và các cờ nâng cao quan trọng (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
- **[typing-functions.md](best-practices/typing-functions.md)**: Khai báo kiểu trả về tường minh, Options Object pattern, `() => void` vs `() => undefined`, Function Overloads.
- **[naming-conventions.md](best-practices/naming-conventions.md)**: Quy ước đặt tên Class, Interface (không dùng `I`), Generic (`TData`), Boolean (`is/has/can`), `private` vs `#private`.

### 3. [snippets/](snippets/) — Đoạn Mã Mẫu Thực Tế / Practical Code Snippets

- **[generics.ts](snippets/generics.ts)**: Generic constraints (`K extends keyof T`), `groupBy`, Generic Repository, tự cài đặt `MyPick`, `MyOmit`, `DeepReadonly`, và `infer`.
- **[async-await.ts](snippets/async-await.ts)**: `withTimeout`, `retryWithBackoff` (Exponential Backoff), `mapWithConcurrency` (Concurrency Limiter), và `Result<T, E>` pattern.
- **[decorator-example.ts](snippets/decorator-example.ts)**: Stage 3 & Experimental Decorators: `@LogExecutionTime`, `@Memoize` (với `WeakMap`), và `@Bound`.

### 4. [design-patterns/](design-patterns/) — Design Patterns Với TypeScript

- **[singleton.md](design-patterns/singleton.md)**: Classic Singleton, ES Module Singleton, Global Singleton chống lỗi HMR, và xử lý Race Condition trong Async Singleton.
- **[factory.md](design-patterns/factory.md)**: Factory kết hợp Discriminated Unions, Exhaustive Switch Check, và Registry-based Factory.
- **[observer.md](design-patterns/observer.md)**: Xây dựng `TypedEventBus<TEventMap>` hoàn toàn type-safe với cơ chế tự trả về hàm `unsubscribe` chống Memory Leak.

### 5. [performance/](performance/) — Hiệu Năng & Tối Ưu Hóa / Performance

- **[tree-shaking.md](performance/tree-shaking.md)**: Tối ưu kích thước bundle, tại sao nên tránh `enum` thường và Barrel files (`index.ts`), cách dùng `import type` và `verbatimModuleSyntax`.
- **[module-resolution.md](performance/module-resolution.md)**: Phân biệt `NodeNext` và `Bundler`, tối ưu tốc độ `tsc` với `incremental`, `skipLibCheck`, và Project References.
- **[memory-leaks.md](performance/memory-leaks.md)**: 5 nguyên nhân gây rò rỉ bộ nhớ, dùng `AbortController`, so sánh `Map` vs `WeakMap`, và từ khóa `using` (`Symbol.dispose`).

### 6. [references.md](references.md) — Tài Liệu Tham Khảo / References

- Tổng hợp tài liệu chính thức, Type Challenges, sách hay và công cụ trong hệ sinh thái TypeScript.

---

## 🚀 Cách Sử Dụng / How to Use

1. **Ôn tập lý thuyết & câu hỏi phỏng vấn**: Đọc từng file trong `pitfalls/`, `best-practices/`, `design-patterns/`, và `performance/` (cuối mỗi bài đều có phần **🎓 Câu Hỏi Phỏng Vấn Thường Gặp**).
2. **Thực hành viết code**: Mở thư mục `snippets/` để xem và chạy thử các bài toán live-coding thường gặp nhất trong phỏng vấn TypeScript.
