// ============================================================================
// PHONE NORMALIZATION UTILITY
// Normalizes phone numbers to a consistent 10-digit format
// ============================================================================

/**
 * Result of phone normalization
 */
export interface PhoneNormalizeResult {
  success: boolean
  normalized: string
  original: string
  error?: string
}

/**
 * Normalizes a phone number to 10 digits (US format)
 *
 * Rules:
 * - Strips all non-digit characters
 * - Removes leading "1" if 11 digits (US country code)
 * - Must be exactly 10 digits after normalization
 *
 * @param phone - The phone number to normalize
 * @returns The normalized 10-digit phone number
 * @throws Error if phone cannot be normalized to 10 digits
 *
 * @example
 * normalizePhone("(801) 555-1234") // "8015551234"
 * normalizePhone("1-801-555-1234") // "8015551234"
 * normalizePhone("+1 801.555.1234") // "8015551234"
 */
export function normalizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    throw new Error('Phone number is required')
  }

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')

  // Remove leading 1 if 11 digits (US country code)
  if (digits.length === 11 && digits[0] === '1') {
    return digits.slice(1)
  }

  // Must be exactly 10 digits
  if (digits.length !== 10) {
    throw new Error(
      `Invalid phone number: "${phone}" has ${digits.length} digits (expected 10)`
    )
  }

  return digits
}

/**
 * Safely normalizes a phone number, returning a result object instead of throwing
 *
 * @param phone - The phone number to normalize
 * @returns Object with success status and normalized/error info
 *
 * @example
 * safeNormalizePhone("(801) 555-1234")
 * // { success: true, normalized: "8015551234", original: "(801) 555-1234" }
 *
 * safeNormalizePhone("123")
 * // { success: false, normalized: "", original: "123", error: "Invalid phone..." }
 */
export function safeNormalizePhone(phone: string): PhoneNormalizeResult {
  try {
    const normalized = normalizePhone(phone)
    return {
      success: true,
      normalized,
      original: phone,
    }
  } catch (error) {
    return {
      success: false,
      normalized: '',
      original: phone,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Validates if a string can be normalized to a valid phone number
 *
 * @param phone - The phone number to validate
 * @returns True if valid, false otherwise
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false
  }

  const digits = phone.replace(/\D/g, '')

  // Check for 10 digits, or 11 with leading 1
  if (digits.length === 10) {
    return true
  }

  if (digits.length === 11 && digits[0] === '1') {
    return true
  }

  return false
}

/**
 * Extracts the area code from a phone number
 *
 * @param phone - The phone number (can be normalized or formatted)
 * @returns The 3-digit area code
 * @throws Error if phone is invalid
 *
 * @example
 * getAreaCode("8015551234") // "801"
 * getAreaCode("(801) 555-1234") // "801"
 */
export function getAreaCode(phone: string): string {
  const normalized = normalizePhone(phone)
  return normalized.slice(0, 3)
}

/**
 * Safely extracts the area code, returning null if invalid
 *
 * @param phone - The phone number
 * @returns The area code or null if invalid
 */
export function safeGetAreaCode(phone: string): string | null {
  try {
    return getAreaCode(phone)
  } catch {
    return null
  }
}

/**
 * Formats a normalized phone number for display
 *
 * @param phone - A normalized 10-digit phone number
 * @param format - The display format to use
 * @returns Formatted phone number
 *
 * @example
 * formatPhoneDisplay("8015551234", "dashed") // "801-555-1234"
 * formatPhoneDisplay("8015551234", "parentheses") // "(801) 555-1234"
 * formatPhoneDisplay("8015551234", "dots") // "801.555.1234"
 */
export function formatPhoneDisplay(
  phone: string,
  format: 'dashed' | 'parentheses' | 'dots' = 'dashed'
): string {
  // Ensure we have a normalized phone
  const normalized = normalizePhone(phone)

  const areaCode = normalized.slice(0, 3)
  const exchange = normalized.slice(3, 6)
  const subscriber = normalized.slice(6, 10)

  switch (format) {
    case 'parentheses':
      return `(${areaCode}) ${exchange}-${subscriber}`
    case 'dots':
      return `${areaCode}.${exchange}.${subscriber}`
    case 'dashed':
    default:
      return `${areaCode}-${exchange}-${subscriber}`
  }
}

/**
 * Batch normalize an array of phone numbers
 *
 * @param phones - Array of phone numbers to normalize
 * @returns Array of normalization results
 */
export function batchNormalizePhones(phones: string[]): PhoneNormalizeResult[] {
  return phones.map((phone) => safeNormalizePhone(phone))
}

/**
 * Count valid phone numbers in an array
 *
 * @param phones - Array of phone numbers
 * @returns Count of valid phones
 */
export function countValidPhones(phones: string[]): number {
  return phones.filter((phone) => isValidPhone(phone)).length
}

/**
 * Checks if a phone number appears to be a toll-free number
 *
 * @param phone - The phone number to check
 * @returns True if toll-free, false otherwise
 */
export function isTollFree(phone: string): boolean {
  const tollFreeAreaCodes = ['800', '833', '844', '855', '866', '877', '888']
  const areaCode = safeGetAreaCode(phone)
  return areaCode !== null && tollFreeAreaCodes.includes(areaCode)
}

/**
 * Checks if a phone number appears to be a mobile carrier code
 * Note: This is a rough heuristic, not definitive
 *
 * @param phone - The phone number to check
 * @returns True if likely mobile, false otherwise
 */
export function isLikelyMobile(phone: string): boolean {
  // This would require a phone type lookup API for accuracy
  // For now, we can't determine this from the number alone
  return false
}
