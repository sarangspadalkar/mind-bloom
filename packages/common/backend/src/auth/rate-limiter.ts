interface RateLimiterOptions {
  /** Maximum number of attempts allowed within the window. */
  maxAttempts: number;
  /** Time window in milliseconds. */
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  /** Milliseconds until the window resets (0 if allowed). */
  retryAfterMs: number;
}

/**
 * Simple in-memory rate limiter keyed by an arbitrary string (e.g. IP address).
 *
 * This is suitable for single-process deployments and demos. In production
 * you would back this with Redis or a similar shared store so that rate
 * limits are enforced across all instances.
 */
export class RateLimiter {
  private store = new Map<string, { count: number; resetAt: number }>();
  private lastCleanup = 0;

  constructor(private opts: RateLimiterOptions) {}

  /**
   * Check whether `key` is within the rate limit. Call this before
   * performing the protected operation. Returns whether the request
   * is allowed and, if not, how long to wait.
   */
  check(key: string): RateLimitResult {
    const now = Date.now();
    this.cleanup(now);

    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.opts.windowMs });
      return { allowed: true, retryAfterMs: 0 };
    }

    entry.count++;

    if (entry.count > this.opts.maxAttempts) {
      return { allowed: false, retryAfterMs: entry.resetAt - now };
    }

    return { allowed: true, retryAfterMs: 0 };
  }

  /** Periodically prune expired entries to avoid memory leaks. */
  private cleanup(now: number) {
    if (now - this.lastCleanup < 60_000) return;
    this.lastCleanup = now;
    for (const [key, entry] of this.store) {
      if (now > entry.resetAt) this.store.delete(key);
    }
  }
}
