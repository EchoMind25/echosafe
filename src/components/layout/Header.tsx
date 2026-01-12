'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  Shield,
  Menu,
} from 'lucide-react'
import type { User } from '@/types'

interface HeaderProps {
  user: User | null
  isLoading: boolean
  onMenuClick?: () => void
  onSignOut: () => void
}

export default function Header({ user, isLoading, onMenuClick, onSignOut }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Menu Button */}
          <button
            onClick={onMenuClick}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-md">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">Echo Mind</span>
          </Link>

          {/* User Avatar */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="relative p-1"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              ) : user ? (
                <span className="text-sm font-semibold text-teal-600">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
              ) : (
                <span className="text-sm font-semibold text-teal-600">D</span>
              )}
            </div>
          </button>
        </div>

        {/* Mobile User Dropdown */}
        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
            <div className="absolute right-4 top-14 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-20">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-900">
                  {user?.fullName || 'Developer'}
                </p>
                <p className="text-xs text-slate-500">
                  {user?.email || 'Development Mode'}
                </p>
                {!user && (
                  <span className="inline-flex items-center mt-2 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                    Full access enabled
                  </span>
                )}
              </div>
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Settings className="w-4 h-4 text-slate-400" />
                Settings
              </Link>
              {user ? (
                <button
                  onClick={() => {
                    setIsMenuOpen(false)
                    onSignOut()
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-teal-600 hover:bg-teal-50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:fixed lg:top-0 lg:left-64 lg:right-0 lg:z-40 lg:flex lg:h-16 lg:items-center lg:gap-x-6 lg:bg-white lg:border-b lg:border-slate-200 lg:px-8">
        {/* Search placeholder - can be expanded later */}
        <div className="flex-1" />

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Dev Mode Badge */}
          {!user && !isLoading && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              Development Mode
            </span>
          )}

          {/* Notifications */}
          <button
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-500 rounded-full" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-3 p-2 pr-3 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                ) : user ? (
                  <span className="text-sm font-semibold text-teal-600">
                    {user.fullName.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-teal-600">D</span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Desktop Dropdown */}
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-20">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-900">
                      {user?.fullName || 'Developer'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {user?.email || 'Development Mode'}
                    </p>
                    {!user && (
                      <span className="inline-flex items-center mt-2 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                        Full access enabled
                      </span>
                    )}
                  </div>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    Settings
                  </Link>
                  {user ? (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false)
                        onSignOut()
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-teal-600 hover:bg-teal-50 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/signup"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Create Account
                      </Link>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
