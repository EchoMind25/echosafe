// ============================================================================
// KVCORE CRM INTEGRATION
// API Key authentication + API client for Kvcore CRM
// ============================================================================

import { decrypt, encrypt } from './encryption'

// ============================================================================
// CONFIGURATION
// ============================================================================

const KVCORE_API_BASE = 'https://api.kvcore.com/v2'
const MAX_REQUESTS_PER_MINUTE = 60

// ============================================================================
// TYPES
// ============================================================================

export interface KvcoreCredentials {
  api_key: string
  account_id?: string
}

export interface KvcoreContact {
  id?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  phone_type?: 'cell' | 'home' | 'work'
  street_address?: string
  city?: string
  state?: string
  zip?: string
  source?: string
  tags?: string[]
  custom_fields?: Record<string, string | number | boolean>
  notes?: string
  lead_type?: 'buyer' | 'seller' | 'both' | 'other'
}

export interface KvcoreApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  pagination?: {
    total: number
    page: number
    per_page: number
  }
}

// ============================================================================
// RATE LIMITER
// ============================================================================

class RateLimiter {
  private requests: number[] = []
  private maxRequests: number
  private windowMs: number

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now()

    // Remove old requests outside window
    this.requests = this.requests.filter(time => now - time < this.windowMs)

    if (this.requests.length >= this.maxRequests) {
      // Calculate wait time
      const oldestRequest = this.requests[0]
      const waitTime = this.windowMs - (now - oldestRequest) + 100 // Add buffer

      console.log(`Kvcore rate limit: waiting ${waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, waitTime))

      // Recursive call to check again
      return this.waitForSlot()
    }

    this.requests.push(now)
  }
}

const rateLimiter = new RateLimiter(MAX_REQUESTS_PER_MINUTE, 60 * 1000)

// ============================================================================
// API CLIENT
// ============================================================================

export class KvcoreClient {
  private apiKey: string
  private accountId?: string

  constructor(encryptedCredentials: string) {
    const decrypted = decrypt(encryptedCredentials)
    const credentials = JSON.parse(decrypted) as KvcoreCredentials
    this.apiKey = credentials.api_key
    this.accountId = credentials.account_id
  }

  /**
   * Make authenticated API request with rate limiting
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: Record<string, unknown>
  ): Promise<T> {
    // Wait for rate limit slot
    await rateLimiter.waitForSlot()

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'X-Source': 'EchoMindCompliance',
    }

    if (this.accountId) {
      headers['X-Account-Id'] = this.accountId
    }

    const response = await fetch(`${KVCORE_API_BASE}${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Kvcore API error [${response.status}]:`, errorText)

      if (response.status === 401) {
        throw new Error('Invalid API key - please check your credentials')
      }
      if (response.status === 403) {
        throw new Error('Access denied - check API key permissions')
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded - please try again later')
      }
      throw new Error(`API request failed: ${response.status}`)
    }

    const result = await response.json() as KvcoreApiResponse<T>

    if (!result.success && result.error) {
      throw new Error(result.error.message || 'Unknown API error')
    }

    return result.data as T
  }

  /**
   * Search for contact by phone number (for duplicate detection)
   */
  async findContactByPhone(phone: string): Promise<KvcoreContact | null> {
    try {
      // Normalize phone to digits only
      const normalizedPhone = phone.replace(/\D/g, '')

      const contacts = await this.request<KvcoreContact[]>(
        'GET',
        `/contacts?phone=${encodeURIComponent(normalizedPhone)}`
      )

      if (contacts && contacts.length > 0) {
        return contacts[0]
      }
      return null
    } catch (error) {
      console.error('Kvcore findContactByPhone error:', error)
      return null
    }
  }

  /**
   * Create a new contact
   */
  async createContact(contact: KvcoreContact): Promise<KvcoreContact> {
    return this.request<KvcoreContact>('POST', '/contacts', contact as Record<string, unknown>)
  }

  /**
   * Update an existing contact
   */
  async updateContact(contactId: string, updates: Partial<KvcoreContact>): Promise<KvcoreContact> {
    return this.request<KvcoreContact>(
      'PUT',
      `/contacts/${contactId}`,
      updates as Record<string, unknown>
    )
  }

  /**
   * Add a note to a contact
   */
  async addNote(contactId: string, note: string): Promise<void> {
    await this.request('POST', `/contacts/${contactId}/notes`, { content: note })
  }

  /**
   * Test connection by fetching account info
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.request('GET', '/account')
      return true
    } catch {
      return false
    }
  }

  /**
   * Get available custom fields
   */
  async getCustomFields(): Promise<Array<{ id: string; name: string; type: string }>> {
    try {
      return await this.request('GET', '/custom-fields')
    } catch {
      return []
    }
  }
}

// ============================================================================
// LEAD MAPPING
// ============================================================================

/**
 * Map CRM lead to Kvcore contact format
 */
export function mapLeadToKvcoreContact(lead: {
  first_name?: string | null
  last_name?: string | null
  phone_number: string
  email?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  risk_score?: number | null
  tags?: string[] | null
  notes?: string | null
  source?: string | null
}): KvcoreContact {
  const contact: KvcoreContact = {
    source: lead.source || 'Echo Safe Compliance',
    lead_type: 'other',
  }

  if (lead.first_name) contact.first_name = lead.first_name
  if (lead.last_name) contact.last_name = lead.last_name
  if (lead.email) contact.email = lead.email

  if (lead.phone_number) {
    contact.phone = lead.phone_number
    contact.phone_type = 'cell'
  }

  if (lead.address) contact.street_address = lead.address
  if (lead.city) contact.city = lead.city
  if (lead.state) contact.state = lead.state
  if (lead.zip_code) contact.zip = lead.zip_code

  if (lead.tags && lead.tags.length > 0) {
    contact.tags = [...lead.tags, 'Echo Safe - Clean Lead']
  } else {
    contact.tags = ['Echo Safe - Clean Lead']
  }

  // Store risk score and sync info in custom fields
  contact.custom_fields = {
    echo_mind_risk_score: lead.risk_score ?? 0,
    echo_mind_sync_date: new Date().toISOString(),
    echo_mind_verified: true,
  }

  return contact
}

/**
 * Encrypt credentials for storage
 */
export function encryptKvcoreCredentials(credentials: KvcoreCredentials): string {
  return encrypt(JSON.stringify(credentials))
}

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string): boolean {
  // Basic validation - adjust based on actual Kvcore API key format
  return apiKey.length >= 20 && /^[a-zA-Z0-9_-]+$/.test(apiKey)
}
