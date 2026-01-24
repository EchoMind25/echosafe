'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface ThemeToggleProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-10 w-10',
}

const iconSizes = {
  sm: 16,
  md: 18,
  lg: 20,
}

export function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        className={`${sizeClasses[size]} rounded-lg bg-slate-100 dark:bg-slate-800 ${className}`}
        disabled
        aria-label="Loading theme toggle"
      />
    )
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`${sizeClasses[size]} flex items-center justify-center rounded-lg transition-colors
        bg-slate-100 hover:bg-slate-200 text-slate-600
        dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300
        ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun size={iconSizes[size]} />
      ) : (
        <Moon size={iconSizes[size]} />
      )}
    </button>
  )
}
