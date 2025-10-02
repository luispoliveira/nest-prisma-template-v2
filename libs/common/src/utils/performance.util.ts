export class PerformanceUtil {
  /**
   * Measure execution time of a function
   */
  static async measureTime<T>(
    operation: () => Promise<T>,
    label?: string,
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await operation();
    const duration = performance.now() - start;

    if (label) {
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    }

    return { result, duration };
  }

  /**
   * Create a debounced version of a function
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  /**
   * Create a throttled version of a function
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;

    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }

  /**
   * Retry operation with exponential backoff
   */
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          throw lastError;
        }

        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Sleep for specified milliseconds
   */
  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute operations in batches to avoid overwhelming the system
   */
  static async executeBatch<T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    batchSize = 10,
    delayBetweenBatches = 100,
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(operation);
      const batchResults = await Promise.all(batchPromises);

      results.push(...batchResults);

      // Add delay between batches if not the last batch
      if (i + batchSize < items.length) {
        await this.sleep(delayBetweenBatches);
      }
    }

    return results;
  }

  /**
   * Create a memoized version of a function with TTL
   */
  static memoizeWithTTL<T extends (...args: any[]) => any>(
    func: T,
    ttl = 300000, // 5 minutes default
  ): T {
    const cache = new Map<string, { value: ReturnType<T>; expiry: number }>();

    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      const now = Date.now();
      const cached = cache.get(key);

      if (cached && cached.expiry > now) {
        return cached.value;
      }

      const result = func(...args);
      cache.set(key, { value: result, expiry: now + ttl });

      return result;
    }) as T;
  }

  /**
   * Monitor memory usage
   */
  static getMemoryUsage(): {
    rss: string;
    heapTotal: string;
    heapUsed: string;
    external: string;
    arrayBuffers: string;
  } {
    const usage = process.memoryUsage();

    return {
      rss: this.formatBytes(usage.rss),
      heapTotal: this.formatBytes(usage.heapTotal),
      heapUsed: this.formatBytes(usage.heapUsed),
      external: this.formatBytes(usage.external),
      arrayBuffers: this.formatBytes(usage.arrayBuffers),
    };
  }

  /**
   * Format bytes to human readable format
   */
  private static formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Create a rate limiter
   */
  static createRateLimiter(maxCalls: number, windowMs: number) {
    const calls: number[] = [];

    return () => {
      const now = Date.now();

      // Remove calls outside the window
      while (calls.length > 0 && calls[0] <= now - windowMs) {
        calls.shift();
      }

      if (calls.length >= maxCalls) {
        return false; // Rate limit exceeded
      }

      calls.push(now);
      return true; // Call allowed
    };
  }
}
