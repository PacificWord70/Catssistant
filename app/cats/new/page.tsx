import Link from 'next/link'
import CatForm from '@/components/CatForm'

/**
 * Next 16 hands `searchParams` over as a Promise. Reading `.prospective` straight
 * off it returns undefined, so the "I found my cat!" path silently fell back to
 * the plain add form. Awaiting it here keeps the page a Server Component.
 */
export default async function NewCatPage({
  searchParams,
}: {
  searchParams: Promise<{ prospective?: string | string[] }>
}) {
  const { prospective: flag } = await searchParams
  const prospective = flag === '1'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl p-7 shadow-soft">
        <Link href="/" className="text-brand-slate text-sm hover:underline mb-5 inline-block">
          ← Home
        </Link>
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 select-none" aria-hidden="true">🐾</div>
          <h1 className="font-display text-3xl text-brand-brown">{prospective ? 'Your Future Cat' : 'Add a Cat'}</h1>
          <p className="text-brand-brown/60 text-sm mt-1">
            {prospective ? 'Tell us about the cat you\'ve picked out' : 'Tell us about your baby'}
          </p>
        </div>
        <CatForm prospective={prospective} />
      </div>
    </div>
  )
}
