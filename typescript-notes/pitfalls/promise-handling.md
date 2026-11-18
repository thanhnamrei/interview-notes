# Promise & Async Handling Pitfalls / Các Lỗi Thường Gặp Khi Xử Lý Promise

## 📖 Tổng Quan / Overview

Lập trình bất đồng bộ với `Promise` và `async/await` trong TypeScript rất mạnh mẽ nhưng dễ mắc các lỗi tinh vi gây rò rỉ lỗi (**unhandled promise rejections**), nghẽn hiệu năng (**sequential waterfalls**), hoặc sai kiểu dữ liệu trả về.

Asynchronous programming with `Promise` and `async/await` in TypeScript is powerful, yet prone to subtle pitfalls that cause **unhandled promise rejections**, **performance bottlenecks**, or unexpected behavior.

---

## 🔴 Các Lỗi Phổ Biến & Cách Khắc Phục / Common Pitfalls & Solutions

### 1. Quên `await` (Floating Promises) & Bẫy `return` trong `try/catch`

Nếu bạn gọi hàm async mà quên `await`, hoặc dùng `return someAsyncFn()` thay vì `return await someAsyncFn()` bên trong khối `try/catch`, lỗi phát sinh từ Promise đó **sẽ không bị bắt bởi khối `catch` hiện tại**!

```typescript
// ❌ BAD - return không có await trong try/catch sẽ KHÔNG bắt được lỗi!
async function fetchUserBad(id: string) {
  try {
    // Trả về thẳng Promise cho caller mà không giải quyết tại đây
    return apiCall(`/users/${id}`);
  } catch (err) {
    // ❌ Khối catch này KHÔNG BAO GIỜ chạy nếu apiCall bị reject!
    console.error("Failed to fetch user:", err);
    return null;
  }
}

// ✅ GOOD - Luôn dùng `return await` khi ở bên trong khối try/catch
async function fetchUserGood(id: string) {
  try {
    return await apiCall(`/users/${id}`);
  } catch (err) {
    // ✅ Bắt được lỗi từ apiCall!
    console.error("Failed to fetch user:", err);
    return null;
  }
}
```

### 2. Dùng `async/await` Trong `.forEach()` / Using `async` Inside `forEach`

`Array.prototype.forEach` không được thiết kế cho hàm bất đồng bộ — nó **không chờ** các Promise hoàn thành mà chạy tiếp ngay lập tức:

```typescript
const userIds = ["u1", "u2", "u3"];

// ❌ BAD - forEach không await, hàm kết thúc trước khi các user được lưu!
async function saveUsersBad(ids: string[]) {
  ids.forEach(async (id) => {
    await saveUserToDb(id); // Chạy ngầm không kiểm soát (floating promises)
  });
  console.log("Done!"); // In ra "Done!" TRƯỚC KHI saveUserToDb chạy xong!
}

// ✅ GOOD 1 - Chạy TUẦN TỰ (Sequential) bằng vòng lặp `for...of`
async function saveUsersSequential(ids: string[]) {
  for (const id of ids) {
    await saveUserToDb(id); // Chờ từng cái xong mới chạy cái tiếp theo
  }
  console.log("All saved sequentially!");
}

// ✅ GOOD 2 - Chạy SONG SONG (Parallel) bằng `Promise.all` + `.map()`
async function saveUsersParallel(ids: string[]) {
  await Promise.all(ids.map((id) => saveUserToDb(id)));
  console.log("All saved in parallel!");
}
```

### 3. Tuần Tự Không Cần Thiết (Async Waterfall)

Khi các tác vụ bất đồng bộ **không phụ thuộc lẫn nhau**, việc `await` từng dòng một làm tổng thời gian chờ bằng tổng các tác vụ cộng lại:

```typescript
// ❌ BAD - Mất 300ms + 300ms + 300ms = 900ms (Sequential Waterfall)
async function loadDashboardSlow(userId: string) {
  const profile = await fetchProfile(userId);       // 300ms
  const orders = await fetchOrders(userId);         // 300ms
  const notifications = await fetchNotifications(userId); // 300ms
  return { profile, orders, notifications };
}

// ✅ GOOD - Chỉ mất ~300ms nhờ chạy song song với Promise.all
async function loadDashboardFast(userId: string) {
  const [profile, orders, notifications] = await Promise.all([
    fetchProfile(userId),
    fetchOrders(userId),
    fetchNotifications(userId),
  ]);
  return { profile, orders, notifications };
}
```

### 4. `Promise.all` vs `Promise.allSettled`

`Promise.all` có cơ chế **fail-fast**: chỉ cần **1 Promise bị reject**, toàn bộ `Promise.all` sẽ reject ngay lập tức và làm mất kết quả của các Promise thành công khác.

```typescript
// ✅ Dùng Promise.allSettled khi muốn lấy kết quả của cả tác vụ thành công lẫn thất bại
async function sendBulkEmails(emails: string[]) {
  const results = await Promise.allSettled(
    emails.map((email) => sendEmail(email))
  );

  const succeeded = results.filter(
    (r): r is PromiseFulfilledResult<string> => r.status === "fulfilled"
  );
  const failed = results.filter(
    (r): r is PromiseRejectedResult => r.status === "rejected"
  );

  console.log(`Sent: ${succeeded.length}, Failed: ${failed.length}`);
}
```

---

## 📊 So Sánh Các Phương Thức Tĩnh Của `Promise` / Promise Combinators

| Phương thức / Method | Hành vi khi thành công / Resolve | Hành vi khi lỗi / Reject | Khi nào dùng / Use Case |
| --- | --- | --- | --- |
| `Promise.all` | Khi **tất cả** resolve | Reject ngay khi **1 cái** reject | Các tác vụ phụ thuộc chặt chẽ (tất cả cùng thành công) |
| `Promise.allSettled` | Luôn resolve khi **tất cả đã xong** | Không bao giờ reject | Xử lý hàng loạt (batch job), muốn biết cái nào lỗi/thành công |
| `Promise.race` | Theo cái đầu tiên kết thúc | Theo cái đầu tiên kết thúc | Gắn timeout cho một request (`race([fetch(), timeout()])`) |
| `Promise.any` | Ngay khi **1 cái đầu tiên** resolve | Khi **tất cả** đều reject (`AggregateError`) | Gọi nhiều server mirror, lấy server phản hồi thành công nhanh nhất |

---

## 🔧 TypeScript Utility Type: `Awaited<T>`

Từ TypeScript 4.5+, dùng `Awaited<T>` để lấy kiểu dữ liệu sau khi giải nén (unwrap) một hoặc nhiều lớp `Promise`:

```typescript
type NestedPromise = Promise<Promise< { id: number; name: string } >>;

// Unwrapped có kiểu: { id: number; name: string }
type Unwrapped = Awaited<NestedPromise>;

async function getProduct() {
  return { id: 101, title: "Keyboard" };
}

// Lấy kiểu trả về thực tế của một hàm async:
type Product = Awaited<ReturnType<typeof getProduct>>;
```

---

## 🎓 Câu Hỏi Phỏng Vấn Thường Gặp / Common Interview Questions

### 1. Tại sao `return await promise` lại cần thiết trong khối `try/catch`?
- **Trả lời / Answer:** Bên ngoài `try/catch`, `return promise` và `return await promise` gần như tương đương. Nhưng bên trong khối `try`, nếu không có `await`, hàm sẽ trả về ngay đối tượng `Promise` đang ở trạng thái pending trước khi nó kịp reject, khiến khối `catch` bị bỏ qua hoàn toàn.

### 2. Làm sao để giới hạn thời gian chạy (timeout) của một Promise trong TypeScript?
- **Trả lời / Answer:** Kết hợp `Promise.race` giữa Promise gốc và một Promise tạo bằng `setTimeout` sẽ tự reject sau khoảng thời gian quy định (nhớ `clearTimeout` trong `finally` để tránh giữ timer trong event loop).

### 3. Sự khác nhau giữa `Promise.race` và `Promise.any` là gì?
- **Trả lời / Answer:** `Promise.race` kết thúc ngay khi Promise đầu tiên **settle** (dù là fulfilled hay rejected). Ngược lại, `Promise.any` bỏ qua các Promise bị reject và chờ cho đến khi có Promise đầu tiên **fulfilled**; nó chỉ reject với `AggregateError` khi tất cả các Promise đầu vào đều bị reject.

---

## 📚 Chủ Đề Liên Quan / Related Topics

- [Async/Await Snippet](../snippets/async-await.ts)
- [Memory Leaks](../performance/memory-leaks.md)
