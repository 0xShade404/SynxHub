/**
 * Fixed-window rate limiter.
 *
 * Uses an in-process Map by default, which is sufficient for a single
 * instance / local development. For a multi-instance production deployment,
 * back this with a shared store (Upstash Redis is wired via
 * UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN — see .env.example) so
 * limits are enforced across all instances rather than per-process.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

// Periodically sweep expired buckets so the map doesn't grow unbounded.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, 60_000).unref?.();
}

export const RATE_LIMITS = {
  LOGIN: { limit: 10, windowMs: 5 * 60 * 1000 },
  WITHDRAWAL_REQUEST: { limit: 5, windowMs: 60 * 60 * 1000 },
  MFA_VERIFY: { limit: 8, windowMs: 5 * 60 * 1000 },
  API_DEFAULT: { limit: 60, windowMs: 60 * 1000 },
} as const;
