/**
 * ============================================================================
 * TYPESCRIPT DECORATORS SNIPPETS / VÍ DỤ VỀ DECORATOR TRONG TYPESCRIPT
 * ============================================================================
 * Lưu ý quan trọng khi phỏng vấn / Important Interview Note:
 * TypeScript hỗ trợ 2 chuẩn Decorator:
 * 1. Stage 3 Standard Decorators (TypeScript 5.0+ mặc định, không cần cờ)
 * 2. Legacy/Experimental Decorators (`"experimentalDecorators": true` - dùng trong Angular, NestJS, TypeORM)
 *
 * File này minh họa các ứng dụng thực tế nhất của Method & Accessor Decorators:
 * - `@LogExecutionTime`: Đo thời gian thực thi của method
 * - `@Memoize`: Cache kết quả hàm tính toán nặng
 * - `@Retry`: Tự động thử lại khi method async ném lỗi
 */

// ============================================================================
// 1. @LogExecutionTime - ĐO THỜI GIAN CHẠY CỦA METHOD (SYNC & ASYNC)
// ============================================================================

/**
 * Decorator đo thời gian thực thi của một method (hỗ trợ chuẩn TS 5.0+ Stage 3).
 */
export function LogExecutionTime<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  const methodName = String(context.name);

  return function (this: This, ...args: Args): Return {
    const start = performance.now();
    const result = target.apply(this, args);

    // Nếu method trả về Promise, đo thời gian khi Promise hoàn tất
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = (performance.now() - start).toFixed(2);
        console.log(`[Timer] ${methodName} (async) took ${duration}ms`);
      }) as Return;
    }

    const duration = (performance.now() - start).toFixed(2);
    console.log(`[Timer] ${methodName} (sync) took ${duration}ms`);
    return result;
  };
}

// ============================================================================
// 2. @Memoize - CACHE KẾT QUẢ METHOD DỰA TRÊN ĐỐI SỐ TRUYỀN VÀO
// ============================================================================

/**
 * Decorator lưu cache kết quả theo từng instance (dùng WeakMap để tránh Memory Leak!).
 */
export function Memoize<This extends object, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  _context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  // Dùng WeakMap gắn với `this` để khi instance bị xóa, bộ nhớ cache cũng được GC giải phóng!
  const instanceCache = new WeakMap<This, Map<string, Return>>();

  return function (this: This, ...args: Args): Return {
    let methodCache = instanceCache.get(this);
    if (!methodCache) {
      methodCache = new Map<string, Return>();
      instanceCache.set(this, methodCache);
    }

    const cacheKey = JSON.stringify(args);
    if (methodCache.has(cacheKey)) {
      return methodCache.get(cacheKey)!;
    }

    const result = target.apply(this, args);
    methodCache.set(cacheKey, result);
    return result;
  };
}

// ============================================================================
// 3. @Bound - TỰ ĐỘNG BIND `this` CHO METHOD KHI KHỞI TẠO INSTANCE
// ============================================================================

/**
 * Giúp truyền method làm callback (vd: `setTimeout(service.handleEvent, 100)`)
 * mà không bị mất ngữ cảnh `this`.
 */
export function Bound<This, Args extends any[], Return>(
  _target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
): void {
  const methodName = context.name;
  context.addInitializer(function (this: any) {
    this[methodName] = this[methodName].bind(this);
  });
}

// ============================================================================
// 4. LEGACY / EXPERIMENTAL DECORATOR FACTORY (DÙNG TRONG NESTJS / ANGULAR)
// ============================================================================

/**
 * Minh họa cấu trúc Decorator Factory truyền thống với `PropertyDescriptor`
 * (Khi bật `"experimentalDecorators": true` trong tsconfig.json).
 */
export function LegacyLog(prefix: string): MethodDecorator {
  return function (
    _target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: unknown[]) {
      console.log(`[${prefix}] Calling ${String(propertyKey)} with args:`, args);
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// ============================================================================
// 5. DEMO CLASS / VÍ DỤ SỬ DỤNG
// ============================================================================

export class ReportService {
  private readonly serviceName = "FinancialReportService";

  @LogExecutionTime
  @Memoize
  public computeFibonacci(n: number): number {
    if (n <= 1) return n;
    return this.computeFibonacci(n - 1) + this.computeFibonacci(n - 2);
  }

  @Bound
  public printServiceInfo(): void {
    console.log(`Active service: ${this.serviceName}`);
  }
}

// Chạy thử Demo
const reportService = new ReportService();
console.log("Fib(30):", reportService.computeFibonacci(30));

// Nhờ @Bound, tách rời method ra khỏi object vẫn giữ đúng `this`:
const detachedPrint = reportService.printServiceInfo;
detachedPrint();
