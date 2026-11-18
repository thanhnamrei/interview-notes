/**
 * ============================================================================
 * TYPESCRIPT GENERICS SNIPPETS / TỔNG HỢP VÍ DỤ VỀ GENERICS TRONG TYPESCRIPT
 * ============================================================================
 * Bao gồm / Covers:
 * 1. Generic Functions & Constraints (`extends`, `keyof`)
 * 2. Generic Interfaces & Classes (Repository Pattern)
 * 3. Built-in Utility Types (`Partial`, `Pick`, `Omit`, `Record`)
 * 4. Custom Mapped Types & Conditional Types (`infer`, `DeepReadonly`)
 */

// ============================================================================
// 1. GENERIC FUNCTIONS & CONSTRAINTS / HÀM GENERIC & RÀNG BUỘC KIỂU
// ============================================================================

/**
 * Lấy giá trị thuộc tính của một object một cách an toàn kiểu (Type-safe property access).
 * Ràng buộc `K extends keyof T` đảm bảo `key` phải tồn tại trên `obj`.
 */
export function getProperty<T extends object, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

/**
 * Nhóm một mảng các phần tử theo một khóa bất kỳ (Group By).
 */
export function groupBy<T, K extends PropertyKey>(
  items: readonly T[],
  keySelector: (item: T) => K
): Record<K, T[]> {
  return items.reduce((acc, item) => {
    const key = keySelector(item);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

// ============================================================================
// 2. GENERIC INTERFACES & CLASSES / INTERFACE & CLASS GENERIC (REPOSITORY)
// ============================================================================

export interface BaseEntity {
  id: string;
  createdAt: Date;
}

/**
 * Generic API Response có giá trị mặc định cho kiểu dữ liệu (`TData = unknown`)
 * và kiểu lỗi (`TError = string`).
 */
export interface ApiResponse<TData = unknown, TError = string> {
  success: boolean;
  data?: TData;
  error?: TError;
}

/**
 * In-Memory Generic Repository.
 * Ràng buộc `T extends BaseEntity` đảm bảo mọi entity đều có thuộc tính `id`.
 */
export class InMemoryRepository<T extends BaseEntity> {
  private readonly items = new Map<string, T>();

  public save(entity: T): T {
    this.items.set(entity.id, entity);
    return entity;
  }

  public findById(id: string): T | undefined {
    return this.items.get(id);
  }

  public findAll(): T[] {
    return Array.from(this.items.values());
  }

  public update(id: string, patch: Partial<Omit<T, "id" | "createdAt">>): T | undefined {
    const existing = this.items.get(id);
    if (!existing) {
      return undefined;
    }
    const updated: T = { ...existing, ...patch };
    this.items.set(id, updated);
    return updated;
  }

  public delete(id: string): boolean {
    return this.items.delete(id);
  }
}

// ============================================================================
// 3. CUSTOM ADVANCED TYPES / CÁC KIỂU GENERIC NÂNG CAO HAY HỎI PHỎNG VẤN
// ============================================================================

/**
 * Câu hỏi phỏng vấn kinh điển #1: Tự viết lại `MyPick<T, K>` và `MyOmit<T, K>`
 */
export type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};

export type MyOmit<T, K extends keyof any> = MyPick<T, Exclude<keyof T, K>>;

/**
 * Câu hỏi phỏng vấn kinh điển #2: `DeepReadonly<T>` (Đệ quy biến mọi cấp thành readonly)
 */
export type DeepReadonly<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

/**
 * Câu hỏi phỏng vấn kinh điển #3: Dùng từ khóa `infer` để lấy kiểu phần tử mảng
 * hoặc kiểu trả về của Promise.
 */
export type ArrayElement<T> = T extends readonly (infer E)[] ? E : never;

export type UnwrapPromise<T> = T extends Promise<infer U> ? UnwrapPromise<U> : T;

// ============================================================================
// 4. DEMO USAGE / VÍ DỤ SỬ DỤNG
// ============================================================================

interface Product extends BaseEntity {
  name: string;
  price: number;
  category: "electronics" | "books";
}

function runGenericsDemo(): void {
  const repo = new InMemoryRepository<Product>();

  const laptop = repo.save({
    id: "p1",
    name: "MacBook Pro",
    price: 2500,
    category: "electronics",
    createdAt: new Date(),
  });

  // 1. Truy cập thuộc tính an toàn kiểu
  const price = getProperty(laptop, "price"); // suy luận đúng kiểu `number`
  console.log("Laptop price:", price);

  // 2. Cập nhật một phần (Partial + Omit)
  repo.update("p1", { price: 2300 });

  // 3. Group By
  const grouped = groupBy(repo.findAll(), (item) => item.category);
  console.log("Grouped electronics count:", grouped.electronics.length);
}

runGenericsDemo();
