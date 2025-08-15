import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter, rateLimiters } from '../rate-limiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests within the limit', () => {
    const limiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 5,
    });

    const ip = '192.168.1.1';
    
    for (let i = 0; i < 5; i++) {
      expect(limiter.tryConsume(ip)).toBe(true);
    }
  });

  it('blocks requests exceeding the limit', () => {
    const limiter = new RateLimiter({
      windowMs: 60000,
      maxRequests: 3,
    });

    const ip = '192.168.1.1';
    
    expect(limiter.tryConsume(ip)).toBe(true);
    expect(limiter.tryConsume(ip)).toBe(true);
    expect(limiter.tryConsume(ip)).toBe(true);
    expect(limiter.tryConsume(ip)).toBe(false); // Should be blocked
  });

  it('resets limits after the time window', () => {
    const limiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 2,
    });

    const ip = '192.168.1.1';
    
    expect(limiter.tryConsume(ip)).toBe(true);
    expect(limiter.tryConsume(ip)).toBe(true);
    expect(limiter.tryConsume(ip)).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(61000);

    expect(limiter.tryConsume(ip)).toBe(true);
  });

  it('tracks different IPs separately', () => {
    const limiter = new RateLimiter({
      windowMs: 60000,
      maxRequests: 2,
    });

    const ip1 = '192.168.1.1';
    const ip2 = '192.168.1.2';
    
    expect(limiter.tryConsume(ip1)).toBe(true);
    expect(limiter.tryConsume(ip1)).toBe(true);
    expect(limiter.tryConsume(ip1)).toBe(false);
    
    // Different IP should still have requests available
    expect(limiter.tryConsume(ip2)).toBe(true);
    expect(limiter.tryConsume(ip2)).toBe(true);
    expect(limiter.tryConsume(ip2)).toBe(false);
  });

  it('correctly reports remaining requests', () => {
    const limiter = new RateLimiter({
      windowMs: 60000,
      maxRequests: 5,
    });

    const ip = '192.168.1.1';
    
    expect(limiter.getRemainingRequests(ip)).toBe(5);
    
    limiter.tryConsume(ip);
    expect(limiter.getRemainingRequests(ip)).toBe(4);
    
    limiter.tryConsume(ip);
    limiter.tryConsume(ip);
    expect(limiter.getRemainingRequests(ip)).toBe(2);
  });

  it('calculates correct reset time', () => {
    const limiter = new RateLimiter({
      windowMs: 60000,
      maxRequests: 5,
    });

    const ip = '192.168.1.1';
    const now = Date.now();
    
    limiter.tryConsume(ip);
    const resetTime = limiter.getResetTime(ip);
    
    expect(resetTime).toBeGreaterThan(now);
    expect(resetTime).toBeLessThanOrEqual(now + 60000);
  });

  it('cleans up old entries', () => {
    const limiter = new RateLimiter({
      windowMs: 60000,
      maxRequests: 2,
    });

    const ip = '192.168.1.1';
    
    limiter.tryConsume(ip);
    expect(limiter.getRemainingRequests(ip)).toBe(1);
    
    // Advance time past the window
    vi.advanceTimersByTime(61000);
    
    // After cleanup, should have full limit available
    expect(limiter.getRemainingRequests(ip)).toBe(2);
  });
});

describe('Pre-configured Rate Limiters', () => {
  it('has correct AI limiter configuration', () => {
    const ip = '192.168.1.1';
    const aiLimiter = rateLimiters.ai;
    
    // Should allow 100 requests per hour
    for (let i = 0; i < 100; i++) {
      expect(aiLimiter.tryConsume(ip)).toBe(true);
    }
    expect(aiLimiter.tryConsume(ip)).toBe(false);
  });

  it('has correct optimize limiter configuration', () => {
    const ip = '192.168.1.1';
    const optimizeLimiter = rateLimiters.optimize;
    
    // Should allow 50 requests per hour
    for (let i = 0; i < 50; i++) {
      expect(optimizeLimiter.tryConsume(ip)).toBe(true);
    }
    expect(optimizeLimiter.tryConsume(ip)).toBe(false);
  });

  it('has correct batch limiter configuration', () => {
    const ip = '192.168.1.1';
    const batchLimiter = rateLimiters.batch;
    
    // Should allow 10 requests per hour
    for (let i = 0; i < 10; i++) {
      expect(batchLimiter.tryConsume(ip)).toBe(true);
    }
    expect(batchLimiter.tryConsume(ip)).toBe(false);
  });

  it('has correct auth limiter configuration', () => {
    const ip = '192.168.1.1';
    const authLimiter = rateLimiters.auth;
    
    // Should allow 5 requests per 15 minutes
    for (let i = 0; i < 5; i++) {
      expect(authLimiter.tryConsume(ip)).toBe(true);
    }
    expect(authLimiter.tryConsume(ip)).toBe(false);
  });

  it('has correct write limiter configuration', () => {
    const ip = '192.168.1.1';
    const writeLimiter = rateLimiters.write;
    
    // Should allow 30 requests per minute
    for (let i = 0; i < 30; i++) {
      expect(writeLimiter.tryConsume(ip)).toBe(true);
    }
    expect(writeLimiter.tryConsume(ip)).toBe(false);
  });
});