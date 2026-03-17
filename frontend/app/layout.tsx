import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Finsight Pro – AI-Powered Personal Finance',
  description:
    'Track expenses, manage budgets, monitor EMI burden, and get smart financial insights with Finsight Pro.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/app-logo.svg',
        type: 'image/svg+xml',
      },
    ],
    shortcut: '/app-logo.svg',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
