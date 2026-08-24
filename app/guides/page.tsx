import Link from 'next/link'

export default function GuidesPage() {
  return (
    <div className="w-full max-w-[min(92vw,64rem)] mx-auto py-16">
      {/* Resources is how this page is reached, so it is the way back out. */}
      <Link
        href="/resources"
        className="hover-lift inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-brand-tan/40 shadow-soft text-brand-brown font-medium hover:bg-brand-tan/15 transition-colors mb-8"
      >
        <span aria-hidden="true">&larr;</span> Other resources
      </Link>

      <div className="text-center">
        <div className="text-7xl mb-6 select-none">📚</div>
        <h1 className="font-display text-3xl text-brand-brown mb-2">Guides</h1>
        <p className="text-brand-brown/60 max-w-xl mx-auto">
          Getting ready for a cat, first vet visits, litter training and settling in — coming soon!
        </p>
      </div>
    </div>
  )
}
