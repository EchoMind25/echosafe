import { cookies } from 'next/headers'
import type { Metadata } from 'next'

// Pricing page SEO metadata
export const metadata: Metadata = {
  title: 'Pricing - Echo Safe | Privacy-First DNC Scrubbing from $47/month',
  description: 'Transparent pricing for DNC compliance. $47/month unlimited scrubbing, 5 area codes, built-in CRM. No tracking, no hidden fees. 7-day trial with 1,000 leads.',
  keywords: [
    'DNC scrubbing pricing',
    'TCPA compliance cost',
    'real estate lead scrubbing',
    'privacy-first lead tools',
    'affordable DNC check',
    'unlimited lead scrubbing',
    'no tracking lead service'
  ],
  openGraph: {
    title: 'Transparent Pricing - Echo Safe',
    description: 'Privacy-first DNC scrubbing. $47/month unlimited. No tracking. No hidden fees.',
    url: 'https://echosafe.app/pricing',
    siteName: 'Echo Safe',
    type: 'website',
    images: [
      {
        url: 'https://echosafe.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Echo Safe Pricing - $47/month unlimited DNC scrubbing',
        type: 'image/png'
      }
    ],
    locale: 'en_US'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Echo Safe Pricing - Privacy-First DNC Compliance',
    description: '$47/month unlimited scrubbing. No tracking. 7-day trial.',
    images: ['https://echosafe.app/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  alternates: {
    canonical: 'https://echosafe.app/pricing'
  },
  other: {
    'price:amount': '47.00',
    'price:currency': 'USD'
  }
}

// Force dynamic rendering by depending on cookies
export default async function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Access cookies to opt into dynamic rendering
  await cookies()

  return <>{children}</>
}
