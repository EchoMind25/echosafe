'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Upload,
  Users,
  Clock,
  Settings,
  Shield,
  X,
} from 'lucide-react'
import type { User } from '@/types'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

const navigation: NavItem[] = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Scrub Leads', href: '/dashboard/scrub', icon: Upload },
  { name: 'CRM', href: '/dashboard/crm', icon: Users },
  { name: 'History', href: '/dashboard/history', icon: Clock },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

interface SidebarProps {
  user: User | null
  isLoading: boolean
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export default function Sidebar({ user, isLoading, isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()

  const NavContent = () => (
    <>
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-3 px-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 dark:from-echo-cyan-400 dark:to-echo-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/20 dark:shadow-echo-cyan-400/20">
          <Shield className="w-5 h-5 text-white dark:text-black" />
        </div>
        <div>
          <span className="text-lg font-bold text-slate-900 dark:text-white">Echo Safe</span>
          <p className="text-xs text-slate-500 dark:text-zinc-500">Lead Scrubbing</p>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col mt-6">
        <ul className="flex flex-1 flex-col gap-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  className={`
                    group flex items-center gap-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-teal-50 dark:bg-echo-cyan-400/10 text-teal-600 dark:text-echo-cyan-400 border-l-4 border-teal-500 dark:border-echo-cyan-400 -ml-1 pl-5'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900'
                    }
                  `}
                >
                  <item.icon
                    className={`w-5 h-5 flex-shrink-0 transition-colors ${
                      isActive ? 'text-teal-500 dark:text-echo-cyan-400' : 'text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300'
                    }`}
                  />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Card */}
      <div className="mt-auto">
        <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-900 p-4 dark:border dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-echo-cyan-400/10 flex items-center justify-center">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-teal-500 dark:border-echo-cyan-400 border-t-transparent rounded-full animate-spin" />
              ) : user ? (
                <span className="text-sm font-semibold text-teal-600 dark:text-echo-cyan-400">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
              ) : (
                <span className="text-sm font-semibold text-teal-600 dark:text-echo-cyan-400">D</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {user?.fullName || 'Developer'}
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-500 truncate">
                {user?.email || 'Development Mode'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-black border-r border-slate-200 dark:border-zinc-800 px-6 py-6">
          <NavContent />
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/50 transition-opacity"
            onClick={onMobileClose}
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-black shadow-xl">
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-zinc-800">
              <Link href="/dashboard" className="flex items-center gap-2" onClick={onMobileClose}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 dark:from-echo-cyan-400 dark:to-echo-cyan-600 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white dark:text-black" />
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white">Echo Safe</span>
              </Link>
              <button
                onClick={onMobileClose}
                className="p-2 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col h-[calc(100%-4rem)] px-4 py-4">
              <nav className="flex-1">
                <ul className="space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          onClick={onMobileClose}
                          className={`
                            flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200
                            ${isActive
                              ? 'bg-teal-50 dark:bg-echo-cyan-400/10 text-teal-600 dark:text-echo-cyan-400'
                              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900'
                            }
                          `}
                        >
                          <item.icon className={`w-5 h-5 ${isActive ? 'text-teal-500 dark:text-echo-cyan-400' : 'text-slate-400 dark:text-zinc-500'}`} />
                          {item.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>

              {/* Mobile User Card */}
              <div className="mt-auto pt-4 border-t border-slate-200 dark:border-zinc-800">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-echo-cyan-400/10 flex items-center justify-center">
                    {user ? (
                      <span className="text-sm font-semibold text-teal-600 dark:text-echo-cyan-400">
                        {user.fullName.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-teal-600 dark:text-echo-cyan-400">D</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {user?.fullName || 'Developer'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-500 truncate">
                      {user?.email || 'Dev Mode'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  )
}
