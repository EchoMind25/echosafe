'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  iconBg: string
  iconColor: string
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral' | 'link'
  linkHref?: string
  badge?: string
  badgeBg?: string
  badgeColor?: string
}

export default function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  value,
  change,
  changeType = 'neutral',
  linkHref,
  badge,
  badgeBg = 'bg-green-100',
  badgeColor = 'text-green-700',
}: StatCardProps) {
  return (
    <div className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-slate-100">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>

        <div className="text-right">
          {changeType === 'link' && linkHref ? (
            <Link
              href={linkHref}
              className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors"
            >
              {change}
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          ) : badge ? (
            <span className={`text-xs ${badgeBg} ${badgeColor} px-2 py-1 rounded font-medium`}>
              {badge}
            </span>
          ) : change ? (
            <span className={`text-xs font-medium ${
              changeType === 'positive'
                ? 'text-green-600'
                : changeType === 'negative'
                  ? 'text-red-600'
                  : 'text-slate-500'
            }`}>
              {change}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        <p className="mt-1 text-sm text-slate-600">{title}</p>
      </div>
    </div>
  )
}
