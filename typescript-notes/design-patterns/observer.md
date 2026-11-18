# Observer Pattern (Typed EventBus) / Mẫu Thiết Kế Observer Trong TypeScript

## 📖 Định Nghĩa / Definition

**Observer Pattern** (hay **Pub/Sub - Publish/Subscribe**) là một Behavioral Design Pattern thiết lập mối quan hệ **một-nhiều (one-to-many)** giữa một đối tượng phát sự kiện (**Subject / Publisher**) và nhiều đối tượng lắng nghe (**Observers / Subscribers**). Khi trạng thái của Subject thay đổi, tất cả các Observer đăng ký sẽ được thông báo tự động.

**Observer Pattern** is a behavioral design pattern that defines a one-to-many dependency between objects so that when one object (Subject) changes state, all its dependents (Observers) are notified automatically.

---

## 💡 Ứng Dụng Thực Tế Trong Hệ Sinh Thái TypeScript / Real-World Use Cases

- ✅ **RxJS `Observable` / `Subject`** (Trái tim của Angular & NestJS Microservices)
- ✅ **Node.js `EventEmitter`** & Browser DOM `addEventListener`
- ✅ **State Management** (Redux, Zustand, MobX, React Context)
- ✅ **In-Process Event Bus** tách rời các domain module (ví dụ: khi `order:created` phát ra, module `Inventory` trừ kho và module `Email` gửi hóa đơn mà không phụ thuộc trực tiếp vào `OrderService`).

---

## 📝 Triển Khai Type-Safe Event Emitter Với Generics / Type-Safe Implementation

Điểm yếu của `EventEmitter` mặc định trong JS là tên sự kiện (`string`) và dữ liệu truyền đi (`any`) không được kiểm tra kiểu. Với TypeScript Generics (`K extends keyof TEventMap`), chúng ta có thể xây dựng một **Typed EventBus** kiểm tra chặt chẽ tên sự kiện và đúng kiểu payload tương ứng!

```typescript
// 1. Định nghĩa kiểu cho hàm lắng nghe (Listener / Observer)
export type EventListener<TPayload> = (payload: TPayload) => void;

// 2. Class TypedEventBus dùng Generic TEventMap
export class TypedEventBus<TEventMap extends Record<string, unknown>> {
  private readonly listeners: {
    [K in keyof TEventMap]?: Set<EventListener<TEventMap[K]>>;
  } = {};

  /**
   * Đăng ký lắng nghe sự kiện và trả về hàm `unsubscribe` để dọn dẹp dễ dàng!
   */
  public on<K extends keyof TEventMap>(
    eventName: K,
    listener: EventListener<TEventMap[K]>
  ): () => void {
    let eventSet = this.listeners[eventName];
    if (!eventSet) {
      eventSet = new Set();
      this.listeners[eventName] = eventSet;
    }

    eventSet.add(listener);

    // Trả về hàm hủy đăng ký (Cleanup function) tránh Memory Leak
    return () => {
      this.off(eventName, listener);
    };
  }

  /**
   * Lắng nghe sự kiện đúng 1 lần duy nhất rồi tự hủy đăng ký.
   */
  public once<K extends keyof TEventMap>(
    eventName: K,
    listener: EventListener<TEventMap[K]>
  ): () => void {
    const unsubscribe = this.on(eventName, (payload) => {
      unsubscribe();
      listener(payload);
    });
    return unsubscribe;
  }

  /**
   * Hủy đăng ký một listener cụ thể.
   */
  public off<K extends keyof TEventMap>(
    eventName: K,
    listener: EventListener<TEventMap[K]>
  ): void {
    this.listeners[eventName]?.delete(listener);
  }

  /**
   * Phát sự kiện tới tất cả các listener đã đăng ký.
   */
  public emit<K extends keyof TEventMap>(
    eventName: K,
    payload: TEventMap[K]
  ): void {
    const eventSet = this.listeners[eventName];
    if (!eventSet) return;

    // Copy ra mảng trước khi duyệt để tránh lỗi nếu listener gọi `off()` ngay trong lúc chạy
    for (const listener of Array.from(eventSet)) {
      listener(payload);
    }
  }
}

// ============================================================================
// 3. VÍ DỤ SỬ DỤNG / DEMO USAGE
// ============================================================================

// Định nghĩa bản đồ sự kiện và kiểu dữ liệu kèm theo
interface AppEvents {
  "user:registered": { userId: string; email: string };
  "order:paid": { orderId: string; totalAmount: number };
  "app:logout": undefined;
}

const eventBus = new TypedEventBus<AppEvents>();

// ✅ Tự động suy luận `data` có kiểu `{ userId: string; email: string }`!
const unsubscribeUser = eventBus.on("user:registered", (data) => {
  console.log(`Sending welcome email to ${data.email} (ID: ${data.userId})`);
});

// Phát sự kiện (sai tên sự kiện hoặc thiếu trường sẽ báo lỗi compile ngay!)
eventBus.emit("user:registered", {
  userId: "u_101",
  email: "alice@example.com",
});

// Hủy đăng ký khi component/service bị hủy để tránh rò rỉ bộ nhớ (Memory Leak)
unsubscribeUser();
```

---

## ⚠️ Lưu Ý Quan Trọng Về Memory Leak / Memory Leak Warning

Trong phỏng vấn, câu hỏi đi kèm với Observer Pattern **luôn luôn** là: *"Rủi ro lớn nhất khi dùng Observer Pattern là gì?"*
- **Trả lời:** **Memory Leak (Lapsed Listener Problem)**. Vì `Subject` giữ tham chiếu mạnh (strong reference) tới tất cả các hàm callback của `Observer` trong mảng/Set, nếu một Component hoặc Service bị hủy nhưng quên gọi `unsubscribe()` / `off()`, Garbage Collector sẽ **không thể** giải phóng đối tượng đó khỏi bộ nhớ.

---

## 🎓 Câu Hỏi Phỏng Vấn Thường Gặp / Common Interview Questions

### 1. Sự khác nhau giữa Observer Pattern và Pub/Sub (Publish-Subscribe) Pattern là gì?
- **Trả lời / Answer:**
  - **Observer Pattern:** `Subject` biết trực tiếp và quản lý danh sách các `Observer` của nó (giao tiếp trực tiếp, thường đồng bộ).
  - **Pub/Sub Pattern:** Có một thành phần trung gian ở giữa (**Event Bus / Message Broker** như Kafka, RabbitMQ, Redis Pub/Sub). `Publisher` và `Subscriber` hoàn toàn không biết sự tồn tại của nhau, chỉ biết đến tên Topic/Event.

### 2. Tại sao hàm `on()` nên trả về một hàm `() => void` (`unsubscribe`)?
- **Trả lời / Answer:** Trả về một closure `() => this.off(event, listener)` giúp nơi gọi hủy đăng ký cực kỳ gọn gàng mà không cần phải lưu lại tham chiếu của hàm callback riêng lẻ (rất tương thích với `useEffect(() => eventBus.on(...), [])` trong React hoặc `DestroyRef` trong Angular).

---

## 📚 Chủ Đề Liên Quan / Related Topics

- [Memory Leaks](../performance/memory-leaks.md)
- [Generics Snippet](../snippets/generics.ts)
- [Singleton Pattern](singleton.md)
