// Simple in-memory rate limiter
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests = 3, windowMs = 60000): boolean {
  const now = Date.now();
  const userLimit = rateLimiter.get(identifier);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit
    rateLimiter.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false; // Rate limit exceeded
  }

  userLimit.count++;
  return true;
}

export function getRemainingRequests(identifier: string, maxRequests = 3): number {
  const userLimit = rateLimiter.get(identifier);
  if (!userLimit || Date.now() > userLimit.resetTime) {
    return maxRequests;
  }
  return Math.max(0, maxRequests - userLimit.count);
}
