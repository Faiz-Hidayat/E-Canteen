/**
 * Simple in-memory rate limiter for Server Actions and API routes.
 *
 * Uses a sliding window counter pattern stored in a Map.
 * Suitable for single-instance deployments (dev, small-scale prod).
 * For multi-instance production, replace with Redis-based limiter.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterOptions {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

// Clean up expired entries periodically (every 60s)
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [, store] of stores) {
      for (const [key, entry] of store) {
        if (now >= entry.resetAt) {
          store.delete(key);
        }
      }
    }
  }, 60_000);

  // Don't prevent Node from exiting
  if (cleanupInterval && typeof cleanupInterval === "object" && "unref" in cleanupInterval) {
    cleanupInterval.unref();
  }
}

/**
 * Create a rate limiter for a specific action/endpoint.
 *
 * @example
 * ```ts
 * const loginLimiter = createRateLimiter("login", { maxRequests: 5, windowMs: 60_000 });
 *
 * export async function loginUser(input) {
 *   const limited = loginLimiter.check(getClientIp());
 *   if (!limited.allowed) return { success: false, error: limited.error };
 *   // ...
 * }
 * ```
 */
export function createRateLimiter(name: string, options: RateLimiterOptions) {
  const store = new Map<string, RateLimitEntry>();
  stores.set(name, store);
  ensureCleanup();

  return {
    /**
     * Check if the given key (e.g., IP address) is rate-limited.
     */
    check(key: string): { allowed: true } | { allowed: false; error: string } {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || now >= entry.resetAt) {
        // New window
        store.set(key, { count: 1, resetAt: now + options.windowMs });
        return { allowed: true };
      }

      if (entry.count >= options.maxRequests) {
        const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
        return {
          allowed: false,
          error: `Terlalu banyak percobaan. Coba lagi dalam ${retryAfterSec} detik.`,
        };
      }

      entry.count += 1;
      return { allowed: true };
    },

    /** Reset limiter for a specific key (e.g., after successful login) */
    reset(key: string) {
      store.delete(key);
    },
  };
}
