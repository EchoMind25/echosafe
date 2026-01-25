import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/providers/theme-provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Echo Safe | Privacy-First DNC Scrubbing & TCPA Compliance',
    template: '%s | Echo Safe',
  },
  description: 'DNC scrubbing that doesn\'t track you. $47/month unlimited scrubbing, AI-powered risk scoring, daily FTC updates. Save $1,200+/year vs per-lead pricing. Delete your data anytime.',
  keywords: [
    'DNC scrubbing',
    'TCPA compliance',
    'Do Not Call registry',
    'lead scrubbing',
    'real estate compliance',
    'privacy-first CRM',
    'AI risk scoring',
    'FTC DNC list',
  ],
  authors: [{ name: 'Echo Safe Systems' }],
  creator: 'Echo Safe Systems',
  publisher: 'Echo Safe Systems',
  metadataBase: new URL('https://echosafe.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://echosafe.app',
    siteName: 'Echo Safe',
    title: 'DNC Scrubbing That Doesn\'t Track You | Echo Safe',
    description: 'Privacy-first DNC compliance for real estate. $47/month unlimited scrubbing, AI risk scoring, daily FTC updates. We never sell your data.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Echo Safe - Privacy-First DNC Compliance',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DNC Scrubbing That Doesn\'t Track You',
    description: 'Privacy-first compliance. $47/month unlimited. AI-powered risk scoring. Delete your data anytime.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Plausible Analytics - Privacy-first, no cookies */}
        <script
          defer
          data-domain="echosafe.app"
          src="https://plausible.io/js/script.js"
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
