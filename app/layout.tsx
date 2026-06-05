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
          {/* White card wraps all inner page content so it sits cleanly on the pink background */}
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: '28px 32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
            minHeight: 'calc(100vh - 10rem)',
          }}>
            {children}
          </div>
        </main>
        <CatWalker />
      </body>
    </html>
  )
}
