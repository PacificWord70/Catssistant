import type { Metadata } from 'next'
import { Figtree, Tapestry } from 'next/font/google'
import './globals.css'
import NavBar from '@/components/NavBar'
import CatWalker from '@/components/CatWalker'

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
})

const tapestry = Tapestry({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-tapestry',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Catssistant',
  description: 'The best assistant for cat owners — helping your baby be as healthy, happy, and cute as possible.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${tapestry.variable}`}>
      <body className="bg-brand-cream text-brand-charcoal font-sans min-h-screen">
        <NavBar />
        <main className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </main>
        <CatWalker />
      </body>
    </html>
  )
}
