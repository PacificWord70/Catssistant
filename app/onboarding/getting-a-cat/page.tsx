import Link from 'next/link'

export default function GettingACatPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-8xl mb-6 select-none">🔍</div>
      <h1 className="font-display text-4xl text-brand-brown mb-3">Exciting! Where are you in the process?</h1>
      <p className="text-brand-brown/60 mb-12 max-w-md text-lg leading-relaxed">
        We'll tailor things a bit depending on where you're at.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Link
          href="/cats/new?prospective=1"
          className="flex-1 px-8 py-5 bg-brand-orange text-white rounded-2xl font-semibold text-lg hover:bg-brand-orange/90 transition-colors shadow-soft"
        >
          I found my cat! 🐾
        </Link>
        <Link
          href="/breeds"
          className="flex-1 px-8 py-5 bg-white text-brand-brown border-2 border-brand-tan rounded-2xl font-semibold text-lg hover:bg-brand-tan/10 transition-colors shadow-soft"
        >
          I&apos;m still researching 📚
        </Link>
      </div>
      <p className="text-sm text-brand-brown/60 mt-8">
        New to cats? Check out our{' '}
        <Link href="/guides" className="text-brand-slate hover:underline">
          guides for first-time owners
        </Link>.
      </p>
    </div>
  )
}
