import { cookies } from 'next/headers'
import AdminShell from '@/components/admin/AdminShell'

// Force dynamic rendering by depending on cookies
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Access cookies to opt into dynamic rendering
  await cookies()

  return <AdminShell>{children}</AdminShell>
}
