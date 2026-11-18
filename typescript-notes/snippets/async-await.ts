/**
 * ============================================================================
 * ASYNC/AWAIT & CONCURRENCY SNIPPETS / LẬP TRÌNH BẤT ĐỒNG BỘ TRONG TYPESCRIPT
 * ============================================================================
 * Các bài toán phỏng vấn thực tế / Real-world interview patterns:
 * 1. Timeout Wrapper (`withTimeout`)
 * 2. Retry with Exponential Backoff (`retryWithBackoff`)
 * 3. Concurrency Limiter (`mapWithConcurrency`)
 * 4. Type-Safe Result Pattern (`Result<T, E>` - không ném ngoại lệ)
 */

// ============================================================================
// 1. HELPER: SLEEP / DELAY
// ============================================================================

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// 2. TIMEOUT WRAPPER / GIỚI HẠN THỜI GIAN CHỜ CHO PROMISE
// ============================================================================

/**
 * Bọc một Promise với thời gian chờ tối đa (timeoutMs).
 * Nhớ dọn dẹp timer trong `finally` để không gây treo tiến trình Node.js!
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = `Operation timed out after ${timeoutMs}ms`
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

// ============================================================================
// 3. RETRY WITH EXPONENTIAL BACKOFF / THỬ LẠI KHI LỖI VỚI ĐỘ TRỄ TĂNG DẦN
// ============================================================================

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

/**
 * Thực thi lại hàm async nếu thất bại, với thời gian chờ tăng theo cấp số nhân:
 * attempt 1: baseDelay * 2^0, attempt 2: baseDelay * 2^1, ...
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 200,
    shouldRetry = () => true,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;

      const canContinue = attempt <= maxRetries && shouldRetry(error, attempt);
      if (!canContinue) {
        throw error;
      }

      const backoffDelay = baseDelayMs * Math.pow(2, attempt - 1);
      await sleep(backoffDelay);
    }
  }

  throw lastError;
}

// ============================================================================
// 4. CONCURRENCY LIMITER / GIỚI HẠN SỐ LƯỢNG TÁC VỤ CHẠY SONG SONG
// ============================================================================

/**
 * Câu hỏi phỏng vấn Senior rất phổ biến:
 * Thay vì chạy `Promise.all` 1000 request cùng lúc làm sập server,
 * chỉ cho phép tối đa `concurrency` tác vụ chạy đồng thời và giữ nguyên thứ tự kết quả.
 */
export async function mapWithConcurrency<TItem, TResult>(
  items: readonly TItem[],
  concurrency: number,
  mapper: (item: TItem, index: number) => Promise<TResult>
): Promise<TResult[]> {
  if (concurrency < 1) {
    throw new Error("Concurrency must be at least 1");
  }

  const results = new Array<TResult>(items.length);
  let currentIndex = 0;

  async function worker(): Promise<void> {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      const item = items[index]!;
      results[index] = await mapper(item, index);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);

  return results;
}

// ============================================================================
// 5. RESULT PATTERN (`tryCatch`) / XỬ LÝ LỖI AN TOÀN KIỂU KHÔNG DÙNG THROW
// ============================================================================

export type Result<T, E = Error> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: E };

export async function tryCatch<T>(promise: Promise<T>): Promise<Result<T, Error>> {
  try {
    const data = await promise;
    return { ok: true, data };
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    return { ok: false, error };
  }
}

// ============================================================================
// 6. DEMO USAGE / VÍ DỤ SỬ DỤNG
// ============================================================================

async function runAsyncDemo(): Promise<void> {
  // 1. Thử nghiệm mapWithConcurrency: Xử lý 5 ID nhưng chỉ chạy tối đa 2 tác vụ cùng lúc
  const ids = [1, 2, 3, 4, 5];
  const processed = await mapWithConcurrency(ids, 2, async (id) => {
    await sleep(50);
    return `User_${id}`;
  });
  console.log("Processed with concurrency=2:", processed);

  // 2. Thử nghiệm tryCatch Result Pattern
  const result = await tryCatch(
    withTimeout(
      sleep(10).then(() => ({ status: 200 })),
      100
    )
  );

  if (result.ok) {
    console.log("Success status:", result.data.status);
  } else {
    console.error("Failed with error:", result.error.message);
  }
}

void runAsyncDemo();
