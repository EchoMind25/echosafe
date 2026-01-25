import { cookies } from 'next/headers'

// Force dynamic rendering by depending on cookies
export default async function ExpansionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Access cookies to opt into dynamic rendering
  await cookies()

  return <>{children}</>
}
