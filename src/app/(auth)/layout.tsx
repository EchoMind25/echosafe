import type { Metadata } from 'next'
import { cookies } from 'next/headers'

export const metadata: Metadata = {
  title: 'Authentication - Echo Safe Compliance',
  description: 'Sign in or create an account for Echo Safe Compliance',
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Access cookies to opt into dynamic rendering
  await cookies()
  return (
    <div className="min-h-screen bg-gradient-to-b from-echo-neutral-50 to-echo-neutral-100 flex flex-col items-center justify-center p-4 md:p-6">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-echo-primary-500">
          Echo Safe Compliance
        </h1>
        <p className="mt-2 text-sm text-echo-neutral-500">
          Intelligent DNC Lead Scrubbing
        </p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md">
        <div className="bg-white shadow-lg rounded-xl p-6 md:p-8">
          {children}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-echo-neutral-400 text-center">
        &copy; {new Date().getFullYear()} Echo Safe Systems. All rights reserved.
      </p>
    </div>
  )
}
