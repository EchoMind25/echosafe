// ============================================================================
// ENCRYPTION UTILITIES
// Secure encryption for API keys and OAuth tokens
// ============================================================================

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const KEY_LENGTH = 32

/**
 * Get encryption key from environment variable
 * SECURITY: No fallback - encryption key MUST be configured
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.INTEGRATION_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET
  const salt = process.env.INTEGRATION_ENCRYPTION_SALT

  // CRITICAL: Never use hardcoded fallback in production
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CRITICAL: INTEGRATION_ENCRYPTION_KEY or NEXTAUTH_SECRET must be set in production. ' +
        'Generate with: openssl rand -base64 32'
      )
    }
    // Development only - warn loudly
    console.warn(
      '\x1b[31m⚠️  WARNING: Using insecure dev encryption key. Set INTEGRATION_ENCRYPTION_KEY in .env.local\x1b[0m'
    )
    return scryptSync('dev-only-insecure-key', 'dev-salt', KEY_LENGTH)
  }

  if (!salt && process.env.NODE_ENV === 'production') {
    throw new Error(
      'CRITICAL: INTEGRATION_ENCRYPTION_SALT must be set in production. ' +
      'Generate with: openssl rand -base64 16'
    )
  }

  return scryptSync(secret, salt || 'dev-salt', KEY_LENGTH)
}

/**
 * Encrypt sensitive data (tokens, API keys)
 * Returns base64 encoded string: iv:encrypted:tag
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return ''

  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  const tag = cipher.getAuthTag()

  // Combine iv:encrypted:tag as base64
  return `${iv.toString('base64')}:${encrypted}:${tag.toString('base64')}`
}

/**
 * Decrypt sensitive data
 * Expects base64 encoded string: iv:encrypted:tag
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return ''

  try {
    const key = getEncryptionKey()
    const parts = encryptedData.split(':')

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format')
    }

    const iv = Buffer.from(parts[0], 'base64')
    const encrypted = parts[1]
    const tag = Buffer.from(parts[2], 'base64')

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encrypted, 'base64', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Decryption failed:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Encrypt credentials object (for storing in database)
 */
export function encryptCredentials(credentials: Record<string, string>): string {
  return encrypt(JSON.stringify(credentials))
}

/**
 * Decrypt credentials object
 */
export function decryptCredentials(encryptedCredentials: string): Record<string, string> {
  const decrypted = decrypt(encryptedCredentials)
  return JSON.parse(decrypted)
}

/**
 * Mask sensitive data for logging (show first/last 4 chars)
 */
export function maskSensitive(value: string): string {
  if (!value || value.length < 12) return '****'
  return `${value.slice(0, 4)}...${value.slice(-4)}`
}
