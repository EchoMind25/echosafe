// ============================================================================
// FOLLOW UP BOSS INTEGRATION
// OAuth 2.0 + API client for Follow Up Boss CRM
// Docs: https://docs.followupboss.com/reference/
// ============================================================================

import { encrypt, decrypt } from './encryption'

// ============================================================================
// CONFIGURATION
// ============================================================================

const FUB_API_BASE = 'https://api.followupboss.com/v1'
const FUB_AUTH_URL = 'https://app.followupboss.com/oauth/authorize'
const FUB_TOKEN_URL = 'https://api.followupboss.com/v1/oauth/token'

const CLIENT_ID = process.env.FOLLOWUPBOSS_CLIENT_ID || ''
const CLIENT_SECRET = process.env.FOLLOWUPBOSS_CLIENT_SECRET || ''
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/followupboss/callback`
  : 'http://localhost:3000/api/integrations/followupboss/callback'

// ============================================================================
// TYPES
// ============================================================================

export interface FUBCredentials {
  access_token: string
  refresh_token: string
  expires_at: number // Unix timestamp
  token_type: string
}

export interface FUBPerson {
  id?: number
  firstName?: string
  lastName?: string
  emails?: Array<{ value: string; isPrimary?: boolean }>
  phones?: Array<{ value: string; type?: string; isPrimary?: boolean }>
  addresses?: Array<{
    street?: string
    city?: string
    state?: string
    code?: string
    country?: string
  }>
  tags?: string[]
  source?: string
  customFields?: Record<string, string>
  notes?: string
}

export interface FUBApiResponse<T> {
  _metadata?: {
    collection: string
    offset: number
    limit: number
    total: number
  }
  people?: T[]
  person?: T
}

// ============================================================================
// OAUTH FLOW
// ============================================================================

/**
 * Generate OAuth authorization URL
 */
export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'people:read people:write',
    state,
  })

  return `${FUB_AUTH_URL}?${params.toString()}`
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<FUBCredentials> {
  const response = await fetch(FUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('FUB token exchange failed:', error)
    throw new Error('Failed to exchange authorization code')
  }

  const data = await response.json()

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in * 1000),
    token_type: data.token_type || 'Bearer',
  }
}

/**
 * Refresh expired access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<FUBCredentials> {
  const response = await fetch(FUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('FUB token refresh failed:', error)
    throw new Error('Failed to refresh access token')
  }

  const data = await response.json()

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken, // Some providers don't return new refresh token
    expires_at: Date.now() + (data.expires_in * 1000),
    token_type: data.token_type || 'Bearer',
  }
}

// ============================================================================
// API CLIENT
// ============================================================================

export class FollowUpBossClient {
  private credentials: FUBCredentials
  private onTokenRefresh?: (credentials: FUBCredentials) => Promise<void>

  constructor(
    encryptedCredentials: string,
    onTokenRefresh?: (credentials: FUBCredentials) => Promise<void>
  ) {
    const decrypted = decrypt(encryptedCredentials)
    this.credentials = JSON.parse(decrypted) as FUBCredentials
    this.onTokenRefresh = onTokenRefresh
  }

  /**
   * Check if token needs refresh (expires in < 5 minutes)
   */
  private isTokenExpired(): boolean {
    return this.credentials.expires_at < Date.now() + (5 * 60 * 1000)
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureValidToken(): Promise<string> {
    if (this.isTokenExpired()) {
      console.log('FUB token expired, refreshing...')
      this.credentials = await refreshAccessToken(this.credentials.refresh_token)

      if (this.onTokenRefresh) {
        await this.onTokenRefresh(this.credentials)
      }
    }
    return this.credentials.access_token
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: Record<string, unknown>
  ): Promise<T> {
    const accessToken = await this.ensureValidToken()

    const response = await fetch(`${FUB_API_BASE}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-System': 'EchoMindCompliance',
        'X-System-Key': process.env.FOLLOWUPBOSS_SYSTEM_KEY || '',
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`FUB API error [${response.status}]:`, errorText)

      if (response.status === 401) {
        throw new Error('Authentication failed - please reconnect')
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded - please try again later')
      }
      throw new Error(`API request failed: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Search for person by phone number (for duplicate detection)
   */
  async findPersonByPhone(phone: string): Promise<FUBPerson | null> {
    try {
      // Normalize phone to digits only
      const normalizedPhone = phone.replace(/\D/g, '')

      const response = await this.request<FUBApiResponse<FUBPerson>>(
        'GET',
        `/people?phone=${encodeURIComponent(normalizedPhone)}`
      )

      if (response.people && response.people.length > 0) {
        return response.people[0]
      }
      return null
    } catch (error) {
      console.error('FUB findPersonByPhone error:', error)
      return null
    }
  }

  /**
   * Create a new person/lead
   */
  async createPerson(person: FUBPerson): Promise<FUBPerson> {
    const response = await this.request<{ person: FUBPerson }>('POST', '/people', person as Record<string, unknown>)
    return response.person
  }

  /**
   * Update an existing person
   */
  async updatePerson(personId: number, updates: Partial<FUBPerson>): Promise<FUBPerson> {
    const response = await this.request<{ person: FUBPerson }>(
      'PUT',
      `/people/${personId}`,
      updates as Record<string, unknown>
    )
    return response.person
  }

  /**
   * Add a note to a person
   */
  async addNote(personId: number, note: string): Promise<void> {
    await this.request('POST', `/people/${personId}/notes`, { body: note })
  }

  /**
   * Test connection by fetching current user
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.request('GET', '/me')
      return true
    } catch {
      return false
    }
  }
}

// ============================================================================
// LEAD MAPPING
// ============================================================================

/**
 * Map CRM lead to Follow Up Boss person format
 */
export function mapLeadToFUBPerson(lead: {
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
}): FUBPerson {
  const person: FUBPerson = {
    source: lead.source || 'Echo Safe Compliance',
  }

  if (lead.first_name) person.firstName = lead.first_name
  if (lead.last_name) person.lastName = lead.last_name

  if (lead.phone_number) {
    person.phones = [{ value: lead.phone_number, type: 'mobile', isPrimary: true }]
  }

  if (lead.email) {
    person.emails = [{ value: lead.email, isPrimary: true }]
  }

  if (lead.address || lead.city || lead.state || lead.zip_code) {
    person.addresses = [{
      street: lead.address || undefined,
      city: lead.city || undefined,
      state: lead.state || undefined,
      code: lead.zip_code || undefined,
      country: 'US',
    }]
  }

  if (lead.tags && lead.tags.length > 0) {
    person.tags = [...lead.tags, 'Echo Safe - Clean Lead']
  } else {
    person.tags = ['Echo Safe - Clean Lead']
  }

  // Store risk score in custom field
  if (lead.risk_score !== null && lead.risk_score !== undefined) {
    person.customFields = {
      'Echo Safe Risk Score': lead.risk_score.toString(),
      'Echo Safe Sync Date': new Date().toISOString(),
    }
  }

  return person
}

/**
 * Encrypt credentials for storage
 */
export function encryptFUBCredentials(credentials: FUBCredentials): string {
  return encrypt(JSON.stringify(credentials))
}
