'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Upload,
  Users,
  Clock,
  Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

const mobileNav: NavItem[] = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Scrub', href: '/dashboard/scrub', icon: Upload },
  { name: 'CRM', href: '/dashboard/crm', icon: Users },
  { name: 'History', href: '/dashboard/history', icon: Clock },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {mobileNav.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex flex-col items-center justify-center flex-1 h-full min-w-touch gap-1
                transition-colors duration-200
                ${isActive ? 'text-teal-500' : 'text-slate-400 active:text-slate-600'}
              `}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-teal-500' : ''}`} />
              <span className={`text-xs font-medium ${isActive ? 'text-teal-500' : ''}`}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
