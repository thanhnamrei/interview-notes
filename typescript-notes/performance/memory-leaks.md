# Memory Leaks in TypeScript / Nhận Diện & Phòng Tránh Rò Rỉ Bộ Nhớ

## 📖 Định Nghĩa / Definition

Mặc dù JavaScript/TypeScript có cơ chế dọn rác tự động (**Garbage Collection - Mark-and-Sweep**), **Memory Leak (Rò rỉ bộ nhớ)** vẫn xảy ra khi các đối tượng không còn cần thiết nữa nhưng vẫn bị **giữ tham chiếu trực tiếp hoặc gián tiếp** từ các gốc (GC Roots như `globalThis`, `window`, closures đang hoạt động, hoặc timers), khiến Garbage Collector không thể giải phóng chúng.

Even though JavaScript/TypeScript engines (like V8) use automatic **Mark-and-Sweep Garbage Collection**, **memory leaks** occur when objects that are no longer needed remain **reachable from GC roots** (such as global variables, active timers, event listeners, or closures).

---

## 🔴 5 Nguyên Nhân Gây Memory Leak Phổ Biến Nhất & Cách Khắc Phục / Top 5 Causes & Fixes

### 1. Quên Hủy Đăng Ký Event Listeners / Subscriptions (Lapsed Listener Problem)

Đây là nguyên nhân số 1 trong cả Frontend (React/Angular) và Backend (Node.js `EventEmitter`).

```typescript
// ❌ BAD - Đăng ký sự kiện nhưng không bao giờ hủy khi component/service bị hủy
export class LeakyChatWidget {
  private readonly messages: string[] = new Array(100_000).fill("cached msg");

  constructor(eventTarget: EventTarget) {
    // Arrow function giữ tham chiếu tới `this` (cùng mảng 100.000 phần tử) mãi mãi!
    eventTarget.addEventListener("message", () => {
      console.log("Current count:", this.messages.length);
    });
  }
}

// ✅ GOOD - Sử dụng AbortController (chuẩn hiện đại cho cả DOM & Node.js) để hủy tất cả cùng lúc!
export class SafeChatWidget {
  private readonly abortController = new AbortController();
  private readonly messages: string[] = [];

  constructor(eventTarget: EventTarget) {
    eventTarget.addEventListener(
      "message",
      () => {
        console.log("Current count:", this.messages.length);
      },
      { signal: this.abortController.signal } // Tự động gỡ listener khi gọi .abort()!
    );
  }

  public destroy(): void {
    this.abortController.abort();
  }
}
```

### 2. `setInterval` / `setTimeout` Không Được Clear

Một `setInterval` đang chạy sẽ giữ sống toàn bộ các biến và đối tượng nằm trong closure của nó cho đến khi gọi `clearInterval`:

```typescript
export classMetricsPoller {
  private timerId: ReturnType<typeof setInterval> | null = null;

  public startPolling(): void {
    // Tránh tạo trùng lặp nhiều interval nếu startPolling được gọi nhiều lần!
    this.stopPolling();

    this.timerId = setInterval(() => {
      this.collectMetrics();
    }, 5000);
  }

  public stopPolling(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private collectMetrics(): void {
    // ...
  }
}
```

### 3. In-Memory Cache Không Giới Hạn (`Map` / `Object` Phình To Vô Hạn)

Dùng một `Map` hoặc `Record` ở cấp module để cache dữ liệu nhưng không có cơ chế **TTL (Time-To-Live)**, **LRU (Least Recently Used)**, hoặc không dùng **`WeakMap`** sẽ làm RAM tăng liên tục cho đến khi crash (`JavaScript heap out of memory`):

```typescript
interface UserSession {
  id: string;
}

// ❌ BAD - Map giữ strong reference tới object key; dù UserSession đã đăng xuất và bị xóa ở nơi khác,
// Map này vẫn giữ nó trong RAM mãi mãi!
const leakyMetadataCache = new Map<UserSession, { lastSeen: Date }>();

// ✅ GOOD 1 - Dùng WeakMap khi key là một Object!
// Khi đối tượng UserSession không còn biến nào khác trỏ tới, Garbage Collector sẽ TỰ ĐỘNG xóa entry đó khỏi WeakMap!
const safeMetadataCache = new WeakMap<UserSession, { lastSeen: Date }>();

// ✅ GOOD 2 - Nếu key là string/number, luôn giới hạn kích thước tối đa (Bounded LRU Cache)
export class SimpleBoundedCache<K, V> {
  private readonly cache = new Map<K, V>();

  constructor(private readonly maxSize = 500) {}

  public set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key); // Làm mới vị trí (Refresh insertion order)
    } else if (this.cache.size >= this.maxSize) {
      // Xóa phần tử cũ nhất (Map trong JS giữ thứ tự chèn!)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
  }

  public get(key: K): V | undefined {
    return this.cache.get(key);
  }
}
```

### 4. Closures Vô Tình Giữ Tham Chiếu Tới Dữ Liệu Lớn

```typescript
// ❌ BAD - Closure được trả về giữ toàn bộ ngữ cảnh lexical scope chứa `hugeBuffer`!
export function createProcessorBad() {
  const hugeBuffer = new Uint8Array(50 * 1024 * 1024); // 50MB
  const summaryLength = hugeBuffer.byteLength;

  return function logSummary() {
    // Dù chỉ dùng summaryLength, trong một số trường hợp nếu closure cùng scope tham chiếu hugeBuffer,
    // hugeBuffer có thể không được giải phóng sớm.
    console.log("Processed bytes:", summaryLength);
  };
}
```

### 5. Dùng `using` / `Symbol.dispose` (TypeScript 5.2+ Explicit Resource Management)

Từ TypeScript 5.2+, bạn có thể dùng từ khóa `using` (tương tự `using` trong C# hoặc `with` trong Python) để đảm bảo tài nguyên (file handle, DB connection, listener) luôn được giải phóng tự động ngay khi ra khỏi khối hàm `{ ... }`:

```typescript
class ManagedDatabaseSession implements Disposable {
  constructor(public readonly sessionId: string) {
    console.log(`[Session ${sessionId}] Opened`);
  }

  public query(sql: string): void {
    console.log(`[Session ${this.sessionId}] Executing: ${sql}`);
  }

  // Tự động được gọi khi biến `using` ra khỏi scope (kể cả khi có throw Error!)
  [Symbol.dispose](): void {
    console.log(`[Session ${this.sessionId}] Closed & Cleaned up!`);
  }
}

export function runQuerySafely(): void {
  using session = new ManagedDatabaseSession("sess_01");
  session.query("SELECT * FROM users");
} // <-- [Symbol.dispose]() tự động chạy tại đây!
```

---

## 📊 So Sánh `Map` vs `WeakMap` (Câu Hỏi Phỏng Vấn Kinh Điển)

| Đặc điểm / Feature | `Map<K, V>` | `WeakMap<K extends object, V>` |
| --- | --- | --- |
| Kiểu dữ liệu của Key (`K`) | Bất kỳ kiểu nào (`string`, `number`, `object`...) | **Bắt buộc là `object`** (hoặc non-registered `symbol`) |
| Tham chiếu tới Key | **Strong reference** (Ngăn GC thu hồi key) | **Weak reference** (Tự động được GC thu hồi khi mất tham chiếu ngoài) |
| Duyệt phần tử (`.keys()`, `for..of`, `.size`) | ✅ Hỗ trợ đầy đủ | ❌ **Không hỗ trợ** (vì phụ thuộc thời điểm GC chạy) |
| Ứng dụng chính | Từ điển tra cứu chung, LRU Cache có kiểm soát | Gắn metadata/cache phụ vào DOM node hoặc Class instance mà không gây Memory Leak |

---

## 🎓 Câu Hỏi Phỏng Vấn Thường Gặp / Common Interview Questions

### 1. Làm thế nào để phát hiện và debug Memory Leak trong ứng dụng Node.js / TypeScript?
- **Trả lời / Answer:**
  1. Quan sát chỉ số `heapUsed` qua `process.memoryUsage()` hoặc Prometheus/Grafana (nếu biểu đồ hình răng cưa nhưng đáy sau luôn cao hơn đáy trước sau mỗi lần GC -> chắc chắn có leak).
  2. Chạy Node.js với cờ `--inspect` và dùng **Chrome DevTools -> Memory tab**.
  3. Chụp **3 Heap Snapshots** (Trước khi thực hiện tác vụ -> Sau khi lặp lại tác vụ 100 lần -> Sau khi bấm nút Force Garbage Collection 🗑️) và dùng chế độ **Comparison** hoặc **Objects allocated between Snapshot 1 and 2** để tìm các object có `Retained Size` lớn bất thường.

### 2. Tại sao `WeakMap` không có thuộc tính `.size` hay phương thức `.forEach()`?
- **Trả lời / Answer:** Vì các phần tử trong `WeakMap` có thể bị Garbage Collector thu hồi bất kỳ lúc nào ở chế độ nền (thời điểm chạy GC là không xác định / non-deterministic). Nếu cho phép duyệt qua các key hoặc đếm `.size`, kết quả trả về sẽ thay đổi ngẫu nhiên tùy thuộc vào việc GC vừa chạy hay chưa.

---

## 📚 Chủ Đề Liên Quan / Related Topics

- [Observer Pattern](../design-patterns/observer.md)
- [Promise Handling](../pitfalls/promise-handling.md)
- [Decorator Example (`@Memoize` với `WeakMap`)](../snippets/decorator-example.ts)
