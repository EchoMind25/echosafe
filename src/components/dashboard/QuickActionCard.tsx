'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface QuickActionCardProps {
  icon: LucideIcon
  title: string
  description: string
  buttonText: string
  href: string
  gradientFrom: string
  gradientTo: string
  textMuted?: string
  buttonBg?: string
  buttonText2?: string
}

export default function QuickActionCard({
  icon: Icon,
  title,
  description,
  buttonText,
  href,
  gradientFrom,
  gradientTo,
  textMuted = 'text-white/80',
  buttonBg = 'bg-white',
  buttonText2 = 'text-teal-600',
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className={`
        group relative overflow-hidden rounded-xl p-6 md:p-8
        bg-gradient-to-br ${gradientFrom} ${gradientTo}
        shadow-lg hover:shadow-xl hover:scale-[1.02]
        transition-all duration-300
      `}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

      {/* Content */}
      <div className="relative z-10">
        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          {title}
        </h3>
        <p className={`${textMuted} mb-6`}>
          {description}
        </p>
        <div className={`inline-flex items-center gap-2 px-6 py-3 ${buttonBg} hover:bg-opacity-90 rounded-lg ${buttonText2} font-semibold transition-all duration-200`}>
          {buttonText}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  )
}
