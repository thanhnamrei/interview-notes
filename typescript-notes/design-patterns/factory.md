# Factory Pattern / Mẫu Thiết Kế Factory Trong TypeScript

## 📖 Định Nghĩa / Definition

**Factory Pattern** là một Creational Design Pattern cung cấp một giao diện chung để khởi tạo đối tượng mà **không cần chỉ định chính xác class cụ thể** sẽ được tạo ra tại nơi sử dụng.

**Factory Pattern** is a creational design pattern that provides an interface for creating objects without specifying their concrete classes at the call site.

---

## 💡 Khi Nào Dùng? / When to Use

- ✅ Tích hợp nhiều cổng thanh toán (**Stripe, PayPal, VNPay, Momo**) có chung hành vi `pay()`, `refund()`.
- ✅ Hệ thống gửi thông báo đa kênh (**Email, SMS, Push Notification, Slack**).
- ✅ Khởi tạo Storage Provider (**AWS S3, Google Cloud Storage, Local Disk**) dựa trên biến môi trường.

---

## 📝 Ví Dụ Thực Tế Với Discriminated Union & Type Safety / Real-World Example

Trong TypeScript, kết hợp **Factory Pattern** với **Discriminated Unions** giúp trình biên dịch kiểm tra chặt chẽ cấu hình tương ứng với từng loại đối tượng:

```typescript
// 1. Định nghĩa giao diện chung (Product Interface)
export interface NotificationSender {
  send(recipient: string, message: string): Promise<void>;
}

// 2. Các lớp cài đặt cụ thể (Concrete Products)
class EmailNotification implements NotificationSender {
  constructor(private readonly smtpHost: string) {}

  public async send(recipient: string, message: string): Promise<void> {
    console.log(`[Email via ${this.smtpHost}] To ${recipient}: ${message}`);
  }
}

class SmsNotification implements NotificationSender {
  constructor(private readonly twilioApiKey: string) {}

  public async send(recipient: string, message: string): Promise<void> {
    console.log(`[SMS] To ${recipient}: ${message}`);
  }
}

class SlackNotification implements NotificationSender {
  constructor(private readonly webhookUrl: string) {}

  public async send(recipient: string, message: string): Promise<void> {
    console.log(`[Slack -> ${this.webhookUrl}] @${recipient}: ${message}`);
  }
}

// 3. Dùng Discriminated Union cho cấu hình đầu vào của Factory (An toàn kiểu 100%!)
export type NotificationConfig =
  | { channel: "email"; smtpHost: string }
  | { channel: "sms"; twilioApiKey: string }
  | { channel: "slack"; webhookUrl: string };

// 4. Factory Function / Class
export class NotificationFactory {
  public static create(config: NotificationConfig): NotificationSender {
    switch (config.channel) {
      case "email":
        // TypeScript tự động hiểu config có thuộc tính `smtpHost`!
        return new EmailNotification(config.smtpHost);
      case "sms":
        return new SmsNotification(config.twilioApiKey);
      case "slack":
        return new SlackNotification(config.webhookUrl);
      default: {
        // Kiểm tra vét cạn (Exhaustive check) với `never`
        const _exhaustiveCheck: never = config;
        throw new Error(`Unsupported notification channel: ${JSON.stringify(_exhaustiveCheck)}`);
      }
    }
  }
}

// Sử dụng / Usage:
const emailSender = NotificationFactory.create({
  channel: "email",
  smtpHost: "smtp.sendgrid.net",
});
void emailSender.send("dev@example.com", "Welcome to TypeScript Notes!");
```

---

## 🚀 Nâng Cao: Registry-Based Factory (Tuân Thủ Open/Closed Principle)

Thay vì dùng `switch-case` (mỗi lần thêm loại mới phải sửa lại hàm `create`), bạn có thể dùng một `Map` đăng ký động (Plugin/Registry Factory):

```typescript
type Creator<T> = () => T;

export class PaymentGatewayRegistry<TGateway> {
  private readonly creators = new Map<string, Creator<TGateway>>();

  public register(providerName: string, creator: Creator<TGateway>): void {
    this.creators.set(providerName, creator);
  }

  public create(providerName: string): TGateway {
    const creator = this.creators.get(providerName);
    if (!creator) {
      throw new Error(`Payment provider "${providerName}" is not registered.`);
    }
    return creator();
  }
}
```

---

## 🎓 Câu Hỏi Phỏng Vấn Thường Gặp / Common Interview Questions

### 1. Phân biệt Simple Factory, Factory Method và Abstract Factory?
- **Trả lời / Answer:**
  - **Simple Factory:** Một hàm hoặc static method nhận tham số (thường dùng `switch-case`) và trả về instance tương ứng.
  - **Factory Method:** Định nghĩa một method tạo đối tượng trong class cha (abstract/interface), nhưng để các class con quyết định khởi tạo class cụ thể nào.
  - **Abstract Factory:** Cung cấp một giao diện để tạo ra **một họ các đối tượng có liên quan với nhau** (ví dụ: `UIFactory` tạo bộ `Button`, `Modal`, `Input` theo theme `DarkTheme` hoặc `LightTheme`).

### 2. Làm sao để đảm bảo khi thêm một loại sản phẩm mới vào Union Type thì Factory không bị quên xử lý?
- **Trả lời / Answer:** Sử dụng kỹ thuật **Exhaustive Switch Check** với kiểu `never` ở nhánh `default`: `const _exhaustive: never = config;`. Nếu thiếu bất kỳ `case` nào trong Union Type, trình biên dịch TypeScript sẽ báo lỗi ngay lập tức.

---

## 📚 Chủ Đề Liên Quan / Related Topics

- [Singleton Pattern](singleton.md)
- [Observer Pattern](observer.md)
- [Any vs Unknown (`never` exhaustive check)](../pitfalls/any-vs-unknown.md)
