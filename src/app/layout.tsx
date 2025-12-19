import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'AdmissionGlobal - Discover and Find the Best Right College',
    template: '%s | AdmissionGlobal',
  },
  description: 'Find the perfect college for your future. Search through thousands of colleges and courses across India. Get expert counselling, compare colleges, and make informed decisions.',
  keywords: 'college search, education, courses, MBA, engineering, medical, law, India colleges, admission counselling, college admission, university search',
  authors: [{ name: 'AdmissionGlobal' }],
  creator: 'AdmissionGlobal',
  publisher: 'AdmissionGlobal',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://www.admissionglobal.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: process.env.NEXT_PUBLIC_BASE_URL || 'https://www.admissionglobal.com',
    siteName: 'AdmissionGlobal',
    title: 'AdmissionGlobal - Discover and Find the Best Right College',
    description: 'Find the perfect college for your future. Search through thousands of colleges and courses across India.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'AdmissionGlobal - College Search Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AdmissionGlobal - Discover and Find the Best Right College',
  description: 'Find the perfect college for your future. Search through thousands of colleges and courses across India.',
    images: ['/og-image.jpg'],
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
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
