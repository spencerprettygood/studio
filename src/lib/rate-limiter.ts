/**
 * In-memory rate limiter using token bucket algorithm
 * For production, replace with Redis/Upstash
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

class RateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private config: RateLimitConfig) {
    // Clean up old buckets every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Check if request should be allowed
   * @param identifier - Unique identifier (userId, IP, etc.)
   * @returns true if allowed, false if rate limited
   */
  async checkLimit(identifier: string): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const now = Date.now();
    let bucket = this.buckets.get(identifier);

    if (!bucket) {
      // Create new bucket for this identifier
      bucket = {
        tokens: this.config.maxRequests - 1,
        lastRefill: now,
      };
      this.buckets.set(identifier, bucket);
      
      return {
        allowed: true,
        remaining: bucket.tokens,
        resetAt: new Date(now + this.config.windowMs),
      };
    }

    // Calculate tokens to add based on time passed
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(timePassed / this.config.windowMs) * this.config.maxRequests;

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(this.config.maxRequests, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }

    // Check if request can be allowed
    if (bucket.tokens > 0) {
      bucket.tokens--;
      return {
        allowed: true,
        remaining: bucket.tokens,
        resetAt: new Date(now + this.config.windowMs),
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(bucket.lastRefill + this.config.windowMs),
    };
  }

  /**
   * Clean up old buckets to prevent memory leak
   */
  private cleanup() {
    const now = Date.now();
    const maxAge = this.config.windowMs * 2;

    for (const [identifier, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > maxAge) {
        this.buckets.delete(identifier);
      }
    }
  }

  /**
   * Destroy the rate limiter and clean up
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.buckets.clear();
  }
}

// Pre-configured rate limiters for different endpoints
export const rateLimiters = {
  // AI endpoints - more restrictive
  ai: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100, // 100 requests per hour
    message: 'Too many AI requests. Please try again later.',
  }),

  // Prompt optimization - very restrictive
  optimize: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50, // 50 optimizations per hour
    message: 'Optimization limit reached. Please try again later.',
  }),

  // Batch processing - most restrictive
  batch: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 batch operations per hour
    message: 'Batch processing limit reached. Please try again later.',
  }),

  // Database writes - moderate
  write: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 writes per minute
    message: 'Too many write operations. Please slow down.',
  }),

  // Authentication attempts - strict
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts. Please try again later.',
  }),

  // General API - lenient
  api: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 300, // 300 requests per minute
    message: 'Rate limit exceeded. Please try again later.',
  }),
};

/**
 * Express/Next.js middleware for rate limiting
 */
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return async (req: any, res: any, next: any) => {
    // Get identifier (prefer userId, fallback to IP)
    const identifier = req.user?.uid || 
                      req.headers['x-forwarded-for'] || 
                      req.connection?.remoteAddress || 
                      'anonymous';

    const result = await limiter.checkLimit(identifier);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limiter['config'].maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.resetAt.toISOString());

    if (!result.allowed) {
      res.setHeader('Retry-After', Math.ceil((result.resetAt.getTime() - Date.now()) / 1000));
      return res.status(429).json({
        error: limiter['config'].message || 'Rate limit exceeded',
        retryAfter: result.resetAt,
      });
    }

    next();
  };
}

export default RateLimiter;