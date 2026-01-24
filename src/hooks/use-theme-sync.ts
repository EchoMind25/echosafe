'use client'

import { useTheme } from 'next-themes'
import { useEffect, useCallback, useRef } from 'react'

interface UseThemeSyncOptions {
  userTheme?: 'light' | 'dark'
  onThemeChange?: (theme: 'light' | 'dark') => void
}

/**
 * Hook to sync theme with user preferences
 * - Applies user's saved theme preference on mount
 * - Calls onThemeChange callback when theme changes (for saving to DB)
 */
export function useThemeSync({ userTheme, onThemeChange }: UseThemeSyncOptions = {}) {
  const { setTheme, resolvedTheme } = useTheme()
  const initialSyncDone = useRef(false)
  const previousTheme = useRef<string | undefined>(undefined)

  // Apply user's saved theme on initial mount
  useEffect(() => {
    if (userTheme && !initialSyncDone.current) {
      setTheme(userTheme)
      initialSyncDone.current = true
      previousTheme.current = userTheme
    }
  }, [userTheme, setTheme])

  // Track theme changes and notify via callback (for saving to DB)
  useEffect(() => {
    // Skip if no callback or theme hasn't resolved yet
    if (!onThemeChange || !resolvedTheme) return

    // Skip the initial sync
    if (!initialSyncDone.current) return

    // Only call if theme actually changed
    if (previousTheme.current !== resolvedTheme) {
      previousTheme.current = resolvedTheme
      onThemeChange(resolvedTheme as 'light' | 'dark')
    }
  }, [resolvedTheme, onThemeChange])

  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }, [resolvedTheme, setTheme])

  return {
    theme: resolvedTheme as 'light' | 'dark' | undefined,
    setTheme: (t: 'light' | 'dark') => setTheme(t),
    toggleTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
  }
}

/**
 * Save theme preference to the server
 */
export async function saveThemePreference(theme: 'light' | 'dark'): Promise<boolean> {
  try {
    const response = await fetch('/api/user/preferences', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ theme }),
    })

    if (!response.ok) {
      console.error('Failed to save theme preference')
      return false
    }

    return true
  } catch (error) {
    console.error('Error saving theme preference:', error)
    return false
  }
}
