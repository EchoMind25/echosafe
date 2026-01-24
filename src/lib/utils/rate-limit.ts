/**
 * Rate Limiting Utility
 *
 * Simple in-memory rate limiter using LRU cache pattern.
 * For production at scale, consider Redis-based rate limiting.
 *
 * Usage:
 * ```ts
 * import { rateLimit, applyRateLimit } from '@/lib/utils/rate-limit'
 *
 * // In API route:
 * const rateLimitResult = await applyRateLimit(req, { limit: 10, window: 60 })
 * if (!rateLimitResult.success) {
 *   return rateLimitResult.response
 * }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

interface RateLimitOptions {
  /** Maximum number of requests allowed in the time window */
  limit: number
  /** Time window in seconds */
  window: number
  /** Custom identifier function (default: IP address) */
  identifier?: (req: NextRequest) => string
}

interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
  response?: NextResponse
}

// In-memory store (works for single-instance deployments)
// For multi-instance deployments, use Redis
const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return

  lastCleanup = now
  const expiredKeys: string[] = []

  store.forEach((entry, key) => {
    if (entry.resetTime < now) {
      expiredKeys.push(key)
    }
  })

  expiredKeys.forEach((key) => store.delete(key))
}

/**
 * Get the identifier for rate limiting (default: IP address)
 */
function getIdentifier(req: NextRequest): string {
  // Try various headers for the real IP
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = req.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a default (for local development)
  return 'unknown-ip'
}

/**
 * Check rate limit for a request
 */
export function rateLimit(
  identifier: string,
  options: { limit: number; window: number }
): RateLimitResult {
  cleanup()

  const now = Date.now()
  const windowMs = options.window * 1000
  const key = identifier

  const entry = store.get(key)

  // No entry or expired entry
  if (!entry || entry.resetTime < now) {
    store.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })
    return {
      success: true,
      remaining: options.limit - 1,
      reset: now + windowMs,
    }
  }

  // Within window
  if (entry.count >= options.limit) {
    return {
      success: false,
      remaining: 0,
      reset: entry.resetTime,
    }
  }

  // Increment counter
  entry.count++
  store.set(key, entry)

  return {
    success: true,
    remaining: options.limit - entry.count,
    reset: entry.resetTime,
  }
}

/**
 * Apply rate limiting to an API route
 *
 * @param req - The NextRequest object
 * @param options - Rate limit options
 * @returns RateLimitResult with success boolean and optional error response
 */
export async function applyRateLimit(
  req: NextRequest,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const identifier = options.identifier
    ? options.identifier(req)
    : getIdentifier(req)

  const result = rateLimit(identifier, {
    limit: options.limit,
    window: options.window,
  })

  if (!result.success) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)

    return {
      ...result,
      response: NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': options.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': retryAfter.toString(),
          },
        }
      ),
    }
  }

  return result
}

/**
 * Create a rate limiter with specific options
 * Useful for creating different rate limiters for different routes
 */
export function createRateLimiter(defaultOptions: RateLimitOptions) {
  return async (req: NextRequest) => applyRateLimit(req, defaultOptions)
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  // Standard API rate limit: 60 requests per minute
  standard: createRateLimiter({ limit: 60, window: 60 }),

  // Upload rate limit: 10 uploads per minute
  upload: createRateLimiter({ limit: 10, window: 60 }),

  // Auth rate limit: 5 attempts per minute (prevent brute force)
  auth: createRateLimiter({ limit: 5, window: 60 }),

  // Webhook rate limit: 100 requests per minute
  webhook: createRateLimiter({ limit: 100, window: 60 }),

  // AI insights rate limit: 20 requests per minute (expensive operation)
  aiInsights: createRateLimiter({ limit: 20, window: 60 }),
}
