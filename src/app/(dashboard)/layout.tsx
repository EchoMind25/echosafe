'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut } from '@/core/services/auth.service'
import type { User } from '@/types'
import { Header, Sidebar, MobileNav } from '@/components/layout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    async function fetchUser() {
      try {
        const result = await getCurrentUser()
        if (result.success && result.data) {
          setUser(result.data)
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        user={user}
        isLoading={isLoading}
        isMobileOpen={isSidebarOpen}
        onMobileClose={() => setIsSidebarOpen(false)}
      />

      {/* Header */}
      <Header
        user={user}
        isLoading={isLoading}
        onMenuClick={() => setIsSidebarOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="pt-16 lg:pt-16 pb-20 lg:pb-8">
          <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  )
}
