// ============================================================================
// STATE AND AREA CODE MAPPING UTILITIES
// Portable utilities for state/area code conversions
// ============================================================================

/**
 * Map of states to their area codes
 * Organized alphabetically by state
 */
export const STATE_AREA_CODES: Record<string, string[]> = {
  AZ: ['602', '480', '520', '928'],
  CO: ['303', '719', '720', '970'],
  ID: ['208', '986'],
  NM: ['505', '575'],
  NV: ['702', '725'],
  UT: ['801', '385', '435'],
  WY: ['307'],
  // Add more states as you expand to new markets
}

/**
 * Reverse map: area code to state
 * Auto-generated from STATE_AREA_CODES for consistency
 */
export const AREA_CODE_TO_STATE: Record<string, string> = {
  // Utah (Primary market)
  '801': 'UT', // Salt Lake City
  '385': 'UT', // Salt Lake City overlay
  '435': 'UT', // Rural Utah

  // Arizona (Expansion market)
  '602': 'AZ', // Phoenix
  '480': 'AZ', // Phoenix east suburbs
  '520': 'AZ', // Tucson
  '928': 'AZ', // Northern Arizona

  // Nevada (Expansion market)
  '702': 'NV', // Las Vegas
  '725': 'NV', // Las Vegas overlay

  // Colorado (Expansion market)
  '303': 'CO', // Denver
  '719': 'CO', // Colorado Springs
  '720': 'CO', // Denver overlay
  '970': 'CO', // Western Colorado

  // Idaho (Adjacent market)
  '208': 'ID', // All Idaho
  '986': 'ID', // Idaho overlay

  // Wyoming (Adjacent market)
  '307': 'WY', // All Wyoming

  // New Mexico (Adjacent market)
  '505': 'NM', // Albuquerque
  '575': 'NM', // Southern New Mexico
}

/**
 * State names for display purposes
 */
export const STATE_NAMES: Record<string, string> = {
  AZ: 'Arizona',
  CO: 'Colorado',
  ID: 'Idaho',
  NM: 'New Mexico',
  NV: 'Nevada',
  UT: 'Utah',
  WY: 'Wyoming',
}

/**
 * Get state from area code
 * @param areaCode - 3-digit area code (e.g., "801", "602")
 * @returns Two-letter state code or null if not found
 *
 * @example
 * ```ts
 * getStateFromAreaCode('801') // 'UT'
 * getStateFromAreaCode('602') // 'AZ'
 * getStateFromAreaCode('999') // null
 * ```
 */
export function getStateFromAreaCode(areaCode: string): string | null {
  return AREA_CODE_TO_STATE[areaCode] || null
}

/**
 * Get all area codes for a given state
 * @param state - Two-letter state code (case-insensitive)
 * @returns Array of area codes or empty array if not found
 *
 * @example
 * ```ts
 * getAreaCodesForState('UT') // ['801', '385', '435']
 * getAreaCodesForState('ut') // ['801', '385', '435']
 * getAreaCodesForState('XX') // []
 * ```
 */
export function getAreaCodesForState(state: string): string[] {
  return STATE_AREA_CODES[state.toUpperCase()] || []
}

/**
 * Get all supported states (alphabetically sorted)
 * @returns Array of two-letter state codes
 *
 * @example
 * ```ts
 * getSupportedStates() // ['AZ', 'CO', 'ID', 'NM', 'NV', 'UT', 'WY']
 * ```
 */
export function getSupportedStates(): string[] {
  return Object.keys(STATE_AREA_CODES).sort()
}

/**
 * Get state name from state code
 * @param state - Two-letter state code
 * @returns Full state name or null if not found
 *
 * @example
 * ```ts
 * getStateName('UT') // 'Utah'
 * getStateName('AZ') // 'Arizona'
 * getStateName('XX') // null
 * ```
 */
export function getStateName(state: string): string | null {
  return STATE_NAMES[state.toUpperCase()] || null
}

/**
 * Parse phone number and extract area code and state
 * @param phoneNumber - Phone number (any format)
 * @returns Object with area code and state (or null if unknown)
 *
 * @example
 * ```ts
 * parsePhoneState('8015551234')     // { areaCode: '801', state: 'UT' }
 * parsePhoneState('(801) 555-1234') // { areaCode: '801', state: 'UT' }
 * parsePhoneState('602-555-1234')   // { areaCode: '602', state: 'AZ' }
 * parsePhoneState('999-555-1234')   // { areaCode: '999', state: null }
 * ```
 */
export function parsePhoneState(phoneNumber: string): {
  areaCode: string
  state: string | null
} {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '')

  // Extract area code (first 3 digits)
  const areaCode = cleaned.slice(0, 3)

  // Look up state
  const state = getStateFromAreaCode(areaCode)

  return { areaCode, state }
}

/**
 * Validate if a state code is supported
 * @param state - Two-letter state code
 * @returns True if state is supported
 *
 * @example
 * ```ts
 * isStateSupported('UT') // true
 * isStateSupported('CA') // false
 * ```
 */
export function isStateSupported(state: string): boolean {
  return state.toUpperCase() in STATE_AREA_CODES
}

/**
 * Validate if an area code is supported
 * @param areaCode - 3-digit area code
 * @returns True if area code is supported
 *
 * @example
 * ```ts
 * isAreaCodeSupported('801') // true
 * isAreaCodeSupported('999') // false
 * ```
 */
export function isAreaCodeSupported(areaCode: string): boolean {
  return areaCode in AREA_CODE_TO_STATE
}

/**
 * Get list of states with their area codes for display
 * @returns Array of objects with state info
 *
 * @example
 * ```ts
 * getStatesList()
 * // [
 * //   { code: 'AZ', name: 'Arizona', areaCodes: ['602', '480', '520', '928'] },
 * //   { code: 'CO', name: 'Colorado', areaCodes: ['303', '719', '720', '970'] },
 * //   ...
 * // ]
 * ```
 */
export function getStatesList(): Array<{
  code: string
  name: string
  areaCodes: string[]
  areaCodeCount: number
}> {
  return getSupportedStates().map((code) => ({
    code,
    name: STATE_NAMES[code] || code,
    areaCodes: STATE_AREA_CODES[code],
    areaCodeCount: STATE_AREA_CODES[code].length,
  }))
}

/**
 * Format state and area code for display
 * @param state - State code
 * @param areaCode - Area code (optional)
 * @returns Formatted string
 *
 * @example
 * ```ts
 * formatStateDisplay('UT', '801') // 'Utah (801)'
 * formatStateDisplay('UT')        // 'Utah'
 * ```
 */
export function formatStateDisplay(state: string, areaCode?: string): string {
  const stateName = getStateName(state)
  if (!stateName) return state

  if (areaCode) {
    return `${stateName} (${areaCode})`
  }

  return stateName
}

/**
 * Get area code display name
 * @param areaCode - 3-digit area code
 * @returns Formatted string with state
 *
 * @example
 * ```ts
 * getAreaCodeDisplay('801') // '801 (Utah)'
 * getAreaCodeDisplay('602') // '602 (Arizona)'
 * ```
 */
export function getAreaCodeDisplay(areaCode: string): string {
  const state = getStateFromAreaCode(areaCode)
  if (!state) return areaCode

  const stateName = getStateName(state)
  return `${areaCode} (${stateName})`
}

/**
 * Batch convert area codes to states
 * @param areaCodes - Array of area codes
 * @returns Map of area code to state
 *
 * @example
 * ```ts
 * batchGetStatesFromAreaCodes(['801', '602', '999'])
 * // Map { '801' => 'UT', '602' => 'AZ', '999' => null }
 * ```
 */
export function batchGetStatesFromAreaCodes(
  areaCodes: string[]
): Map<string, string | null> {
  const result = new Map<string, string | null>()

  for (const areaCode of areaCodes) {
    result.set(areaCode, getStateFromAreaCode(areaCode))
  }

  return result
}

/**
 * Get statistics about supported coverage
 * @returns Coverage statistics
 */
export function getCoverageStats() {
  const states = getSupportedStates()
  const totalAreaCodes = Object.values(STATE_AREA_CODES).reduce(
    (sum, codes) => sum + codes.length,
    0
  )

  return {
    totalStates: states.length,
    totalAreaCodes,
    states: states.join(', '),
    averageAreaCodesPerState: (totalAreaCodes / states.length).toFixed(1),
  }
}
