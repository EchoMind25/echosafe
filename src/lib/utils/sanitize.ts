/**
 * Input Sanitization Utility
 *
 * Provides functions to sanitize user input to prevent XSS and injection attacks.
 *
 * Usage:
 * ```ts
 * import { sanitizeText, sanitizeHtml, sanitizeForDatabase } from '@/lib/utils/sanitize'
 *
 * const cleanText = sanitizeText(userInput)
 * const cleanHtml = sanitizeHtml(userHtml)
 * ```
 */

/**
 * Escape HTML entities to prevent XSS
 * Use this for plain text that will be rendered in HTML
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return ''

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Strip all HTML tags from text
 * Use this when you want to remove all HTML but keep text content
 */
export function stripHtml(text: string | null | undefined): string {
  if (!text) return ''

  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .trim()
}

/**
 * Sanitize HTML to allow only safe tags
 * Use this for rich text content
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return ''

  // List of allowed tags (no attributes)
  const allowedTags = ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'ul', 'ol', 'li']

  // First, escape everything
  let result = sanitizeText(html)

  // Then, unescape allowed tags
  for (const tag of allowedTags) {
    // Opening tags
    const openPattern = new RegExp(`&lt;${tag}&gt;`, 'gi')
    result = result.replace(openPattern, `<${tag}>`)

    // Closing tags
    const closePattern = new RegExp(`&lt;\\/${tag}&gt;`, 'gi')
    result = result.replace(closePattern, `</${tag}>`)
  }

  return result
}

/**
 * Sanitize for database storage
 * Removes null bytes and normalizes whitespace
 */
export function sanitizeForDatabase(text: string | null | undefined): string {
  if (!text) return ''

  return text
    // Remove null bytes (can cause issues in some databases)
    .replace(/\0/g, '')
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Trim excessive whitespace
    .trim()
}

/**
 * Sanitize phone number (keep only digits)
 */
export function sanitizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return ''
  return phone.replace(/\D/g, '')
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return ''

  return email
    .toLowerCase()
    .trim()
    // Remove any characters that aren't valid in emails
    .replace(/[^\w.@+-]/g, '')
}

/**
 * Sanitize a URL
 * Returns empty string if URL is invalid or uses dangerous protocols
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return ''

  try {
    const parsed = new URL(url)

    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return ''
    }

    return parsed.toString()
  } catch {
    // Invalid URL
    return ''
  }
}

/**
 * Sanitize JSON for storage
 * Ensures the value is valid JSON and strips dangerous keys
 */
export function sanitizeJson(
  json: unknown,
  dangerousKeys: string[] = ['__proto__', 'constructor', 'prototype']
): unknown {
  if (json === null || json === undefined) return null

  // For primitives, return as-is
  if (typeof json !== 'object') {
    if (typeof json === 'string') {
      return sanitizeForDatabase(json)
    }
    return json
  }

  // For arrays, recursively sanitize each element
  if (Array.isArray(json)) {
    return json.map((item) => sanitizeJson(item, dangerousKeys))
  }

  // For objects, filter dangerous keys and recursively sanitize
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(json)) {
    // Skip dangerous keys
    if (dangerousKeys.includes(key)) continue

    // Recursively sanitize the value
    result[key] = sanitizeJson(value, dangerousKeys)
  }

  return result
}

/**
 * Validate and sanitize user input object
 * Useful for sanitizing entire request bodies
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: {
    stripHtmlFields?: string[]
    phoneFields?: string[]
    emailFields?: string[]
    urlFields?: string[]
  } = {}
): T {
  const result = { ...obj }

  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string') {
      // Check for specific field types
      if (options.stripHtmlFields?.includes(key)) {
        (result as Record<string, unknown>)[key] = stripHtml(value)
      } else if (options.phoneFields?.includes(key)) {
        (result as Record<string, unknown>)[key] = sanitizePhoneNumber(value)
      } else if (options.emailFields?.includes(key)) {
        (result as Record<string, unknown>)[key] = sanitizeEmail(value)
      } else if (options.urlFields?.includes(key)) {
        (result as Record<string, unknown>)[key] = sanitizeUrl(value)
      } else {
        // Default: sanitize for database
        (result as Record<string, unknown>)[key] = sanitizeForDatabase(value)
      }
    } else if (typeof value === 'object' && value !== null) {
      (result as Record<string, unknown>)[key] = sanitizeJson(value)
    }
  }

  return result
}
