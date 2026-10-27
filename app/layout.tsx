import type { Metadata } from 'next'
import { Figtree, Fraunces } from 'next/font/google'
import './globals.css'
import NavBar from '@/components/NavBar'
import ExampleBanner from '@/components/ExampleBanner'
import StoreProvider from '@/store/StoreProvider'

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Catssistant',
  description: 'The best assistant for cat owners — helping your baby be as healthy, happy, and cute as possible.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${fraunces.variable}`}>
      <body className="text-brand-charcoal font-sans min-h-screen">
        <StoreProvider>
          <NavBar />
          {/* Width follows the screen: gutters step up with the viewport, and
              the cap only bites on displays wider than about 1900px. The cap is
              not the same thing as the line-length caps inside pages — those
              stay, because a form stretched across a monitor is worse, not
              better. Keep this in step with the NavBar's container. */}
          <main className="w-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 py-8">
            <ExampleBanner />
            {children}
          </main>
        </StoreProvider>
      </body>
    </html>
  )
}
