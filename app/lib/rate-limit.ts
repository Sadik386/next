const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
};

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + config.windowMs });
    return true;
  }

  if (record.count >= config.maxRequests) return false;

  record.count++;
  return true;
}

export function getRateLimitResponse(message = "Too many requests. Please try again later.") {
  return {
    success: false,
    message,
  };
}

// Clean up old entries periodically (in production, use Redis or similar)
if (typeof setInterval === "function") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 60 * 60 * 1000); // Clean every hour
}