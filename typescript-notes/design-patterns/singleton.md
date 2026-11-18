# Singleton Pattern / Mẫu Thiết Kế Singleton Trong TypeScript

## 📖 Định Nghĩa / Definition

**Singleton** là một Creational Design Pattern đảm bảo một class chỉ có **duy nhất một instance** trong toàn bộ vòng đời ứng dụng và cung cấp một điểm truy cập toàn cục (**global access point**) tới instance đó.

**Singleton** is a creational design pattern that ensures a class has **only one instance** and provides a global point of access to it.

---

## 💡 Khi Nào Dùng Trong TypeScript/Node.js? / When to Use

- ✅ **Database Connection Pool** (PrismaClient, TypeORM DataSource, Redis Client)
- ✅ **Configuration Manager** (Đọc và lưu trữ biến môi trường `process.env`)
- ✅ **Logger Service** (Winston / Pino logger dùng chung toàn hệ thống)
- ✅ **In-Memory Cache / State Store**

---

## 📝 Các Cách Triển Khai Trong TypeScript / Implementations

### 1. Classic Class Singleton (`private constructor`)

```typescript
export class AppConfigService {
  // Lưu trữ instance duy nhất
  private static instance: AppConfigService | null = null;

  private readonly settings: ReadonlyMap<string, string>;

  // 🔒 `private constructor` ngăn không cho bên ngoài gọi `new AppConfigService()`
  private constructor() {
    this.settings = new Map([
      ["API_URL", "https://api.example.com"],
      ["ENV", "production"],
    ]);
  }

  public static getInstance(): AppConfigService {
    if (!AppConfigService.instance) {
      AppConfigService.instance = new AppConfigService();
    }
    return AppConfigService.instance;
  }

  public get(key: string): string | undefined {
    return this.settings.get(key);
  }
}

// Sử dụng / Usage:
// const bad = new AppConfigService(); // ❌ Compile Error: Constructor is private!
const config1 = AppConfigService.getInstance();
const config2 = AppConfigService.getInstance();
console.log(config1 === config2); // true
```

### 2. ES Module Singleton (Cách Idiomatic Nhất Trong TS/JS Hiện Đại)

Trong ES Modules (ESM) và CommonJS, các module được **cache tự động** sau lần `import` đầu tiên. Do đó, bạn chỉ cần khởi tạo và `export` trực tiếp instance mà không cần viết boilerplate `getInstance()` phức tạp!

```typescript
// logger.ts
class Logger {
  public info(message: string): void {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
  }
}

// Export trực tiếp 1 instance duy nhất (Module-scoped Singleton)
export const logger = new Logger();
```

### 3. Global Singleton Chống Lỗi Hot-Reload (Next.js / Vite / Node Watch)

Trong môi trường development có **Hot Module Replacement (HMR)**, mỗi lần lưu file module sẽ bị chạy lại, tạo ra nhiều kết nối Database gây lỗi `Too many connections`. Cách chuẩn (như Prisma khuyến nghị) là gắn instance vào `globalThis`:

```typescript
export class DatabaseClient {
  public connect(): void {
    console.log("Connected to DB");
  }
}

// Mở rộng kiểu cho globalThis
const globalForDb = globalThis as unknown as {
  dbClient?: DatabaseClient;
};

export const dbClient = globalForDb.dbClient ?? new DatabaseClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.dbClient = dbClient;
}
```

---

## ⚖️ Ưu Điểm & Nhược Điểm / Pros & Cons

| Ưu điểm / Pros | Nhược điểm / Cons |
| --- | --- |
| Đảm bảo chỉ có 1 instance, tiết kiệm tài nguyên (DB pool, socket). | Tạo sự phụ thuộc ngầm (hidden dependencies), khó viết Unit Test / Mock. |
| Khởi tạo lười (Lazy initialization) khi lần đầu gọi `getInstance()`. | Vi phạm Single Responsibility Principle (vừa quản lý vòng đời, vừa xử lý logic). |

---

## 🎓 Câu Hỏi Phỏng Vấn Thường Gặp / Common Interview Questions

### 1. Trong JavaScript/TypeScript có cần `lock` (Double-Checked Locking) cho Singleton như C#/Java không?
- **Trả lời / Answer:** **Không cần** đối với việc khởi tạo đồng bộ (`new Class()`), vì JavaScript/Node.js chạy code người dùng trên **Single Thread (Event Loop)** nên không có hai luồng chạy xen kẽ vào giữa hàm `getInstance()` đồng bộ.
- **Lưu ý nâng cao (Senior trap):** Nếu việc khởi tạo là **bất đồng bộ** (`async getInstance()`), hai lời gọi đồng thời *có thể* cùng thấy `instance === null` trước khi `await connect()` hoàn thành! Khi đó bạn phải lưu **chính đối tượng `Promise<Instance>`** vào biến static thay vì lưu kết quả sau khi `await`.

```typescript
// ✅ Cách chống Race Condition cho Async Singleton trong TS
class AsyncDatabase {
  private static initPromise: Promise<AsyncDatabase> | null = null;

  private constructor() {}

  public static getInstance(): Promise<AsyncDatabase> {
    if (!this.initPromise) {
      this.initPromise = (async () => {
        const db = new AsyncDatabase();
        await db.connect();
        return db;
      })();
    }
    return this.initPromise;
  }

  private async connect(): Promise<void> {}
}
```

### 2. Tại sao Dependency Injection (DI) thường được ưa chuộng hơn gọi `Singleton.getInstance()` trực tiếp?
- **Trả lời / Answer:** Gọi `Singleton.getInstance()` trực tiếp bên trong các class làm code bị gắn chặt (tight coupling), rất khó thay thế bằng Mock/Fake khi chạy Unit Test. Với DI (như trong NestJS hoặc Angular), DI Container vẫn quản lý service đó như một Singleton, nhưng truyền nó qua `constructor` theo một `interface`, giúp test dễ dàng.

---

## 📚 Chủ Đề Liên Quan / Related Topics

- [Factory Pattern](factory.md)
- [Observer Pattern](observer.md)
- [Memory Leaks](../performance/memory-leaks.md)
