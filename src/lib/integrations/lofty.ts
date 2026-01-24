// ============================================================================
// LOFTY CRM INTEGRATION
// API Key authentication + API client for Lofty CRM
// ============================================================================

import { decrypt, encrypt } from './encryption'

// ============================================================================
// CONFIGURATION
// ============================================================================

const LOFTY_API_BASE = 'https://api.lofty.com/v1'
const MAX_REQUESTS_PER_MINUTE = 100

// ============================================================================
// TYPES
// ============================================================================

export interface LoftyCredentials {
  api_key: string
  team_id?: string
}

export interface LoftyContact {
  id?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  phoneType?: 'mobile' | 'home' | 'work'
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  source?: string
  tags?: string[]
  customFields?: Record<string, string | number | boolean>
  notes?: string
}

export interface LoftyApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  meta?: {
    total: number
    page: number
    limit: number
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

      console.log(`Lofty rate limit: waiting ${waitTime}ms`)
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

export class LoftyClient {
  private apiKey: string
  private teamId?: string

  constructor(encryptedCredentials: string) {
    const decrypted = decrypt(encryptedCredentials)
    const credentials = JSON.parse(decrypted) as LoftyCredentials
    this.apiKey = credentials.api_key
    this.teamId = credentials.team_id
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

    if (this.teamId) {
      headers['X-Team-Id'] = this.teamId
    }

    const response = await fetch(`${LOFTY_API_BASE}${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Lofty API error [${response.status}]:`, errorText)

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

    const result = await response.json() as LoftyApiResponse<T>

    if (!result.success && result.error) {
      throw new Error(result.error.message || 'Unknown API error')
    }

    return result.data as T
  }

  /**
   * Search for contact by phone number (for duplicate detection)
   */
  async findContactByPhone(phone: string): Promise<LoftyContact | null> {
    try {
      // Normalize phone to digits only
      const normalizedPhone = phone.replace(/\D/g, '')

      const contacts = await this.request<LoftyContact[]>(
        'GET',
        `/contacts?phone=${encodeURIComponent(normalizedPhone)}`
      )

      if (contacts && contacts.length > 0) {
        return contacts[0]
      }
      return null
    } catch (error) {
      console.error('Lofty findContactByPhone error:', error)
      return null
    }
  }

  /**
   * Create a new contact
   */
  async createContact(contact: LoftyContact): Promise<LoftyContact> {
    return this.request<LoftyContact>('POST', '/contacts', contact as Record<string, unknown>)
  }

  /**
   * Update an existing contact
   */
  async updateContact(contactId: string, updates: Partial<LoftyContact>): Promise<LoftyContact> {
    return this.request<LoftyContact>(
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
 * Map CRM lead to Lofty contact format
 */
export function mapLeadToLoftyContact(lead: {
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
}): LoftyContact {
  const contact: LoftyContact = {
    source: lead.source || 'Echo Safe Compliance',
  }

  if (lead.first_name) contact.firstName = lead.first_name
  if (lead.last_name) contact.lastName = lead.last_name
  if (lead.email) contact.email = lead.email

  if (lead.phone_number) {
    contact.phone = lead.phone_number
    contact.phoneType = 'mobile'
  }

  if (lead.address || lead.city || lead.state || lead.zip_code) {
    contact.address = {
      street: lead.address || undefined,
      city: lead.city || undefined,
      state: lead.state || undefined,
      zipCode: lead.zip_code || undefined,
      country: 'US',
    }
  }

  if (lead.tags && lead.tags.length > 0) {
    contact.tags = [...lead.tags, 'Echo Safe - Clean Lead']
  } else {
    contact.tags = ['Echo Safe - Clean Lead']
  }

  // Store risk score and sync info in custom fields
  contact.customFields = {
    echoMindRiskScore: lead.risk_score ?? 0,
    echoMindSyncDate: new Date().toISOString(),
    echoMindVerified: true,
  }

  return contact
}

/**
 * Encrypt credentials for storage
 */
export function encryptLoftyCredentials(credentials: LoftyCredentials): string {
  return encrypt(JSON.stringify(credentials))
}

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string): boolean {
  // Basic validation - adjust based on actual Lofty API key format
  return apiKey.length >= 20 && /^[a-zA-Z0-9_-]+$/.test(apiKey)
}
