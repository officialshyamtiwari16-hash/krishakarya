/**
 * Client-Side Rate Limiter to prevent form spam and denial of service.
 * Tracks sliding-window timestamps per action category.
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // in milliseconds
}

const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  booking_submit: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 bookings per min
  listing_create: { maxRequests: 3, windowMs: 5 * 60 * 1000 }, // 3 listings per 5 mins
  review_submit: { maxRequests: 3, windowMs: 60 * 1000 }, // 3 reviews per min
  otp_request: { maxRequests: 3, windowMs: 60 * 1000 }, // 3 OTP requests per min
  contact_submit: { maxRequests: 3, windowMs: 60 * 1000 }, // 3 contact messages per min
};

class RateLimiter {
  private timestamps: Map<string, number[]> = new Map();

  checkLimit(action: string, customConfig?: RateLimitConfig): { allowed: boolean; remainingCooldownSec?: number } {
    const config = customConfig || DEFAULT_CONFIGS[action] || { maxRequests: 5, windowMs: 60000 };
    const now = Date.now();
    const history = this.timestamps.get(action) || [];

    // Filter out timestamps outside the window
    const validHistory = history.filter((time) => now - time < config.windowMs);

    if (validHistory.length >= config.maxRequests) {
      const oldestTime = validHistory[0];
      const remainingCooldownMs = config.windowMs - (now - oldestTime);
      const remainingCooldownSec = Math.ceil(remainingCooldownMs / 1000);
      return { allowed: false, remainingCooldownSec };
    }

    validHistory.push(now);
    this.timestamps.set(action, validHistory);
    return { allowed: true };
  }

  reset(action: string) {
    this.timestamps.delete(action);
  }
}

export const rateLimiter = new RateLimiter();
