import Link from 'next/link'
import CatForm from '@/components/CatForm'

export default function NewCatPage({ searchParams }: { searchParams: { prospective?: string } }) {
  const prospective = searchParams.prospective === '1'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl p-7 shadow-sm">
        <Link href="/" className="text-brand-slate text-sm hover:underline mb-5 inline-block">
          ← Home
        </Link>
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 select-none">🐾</div>
          <h1 className="font-display text-3xl text-brand-brown">{prospective ? 'Your Future Cat' : 'Add a Cat'}</h1>
          <p className="text-gray-400 text-sm mt-1">
            {prospective ? 'Tell us about the cat you\'ve picked out' : 'Tell us about your baby'}
          </p>
        </div>
        <CatForm prospective={prospective} />
      </div>
    </div>
  )
}
