import Link from 'next/link'

export default function GuidesPage() {
  return (
    <div className="py-16">
      {/* Resources is how this page is reached, so it is the way back out. */}
      <Link href="/resources" className="text-brand-slate text-sm hover:underline inline-block mb-10">
        ← Other resources
      </Link>

      <div className="text-center">
        <div className="text-7xl mb-6 select-none">📚</div>
        <h1 className="font-display text-3xl text-brand-brown mb-2">Guides</h1>
        <p className="text-brand-brown/60 max-w-sm mx-auto">
          Getting ready for a cat, first vet visits, litter training and settling in — coming soon!
        </p>
      </div>
    </div>
  )
}
