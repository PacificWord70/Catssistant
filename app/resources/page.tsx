import Link from 'next/link'

export default function ResourcesPage() {
  return (
    <div className="w-full max-w-[min(92vw,64rem)] mx-auto text-center py-24">
      <div className="text-7xl mb-6 select-none">🔗</div>
      <h1 className="font-display text-3xl text-brand-brown mb-2">Resources</h1>
      <p className="text-brand-brown/60 max-w-xl mx-auto">
        Nearby vets, emergency clinics, boarding, adoption sites, and external links — coming soon!
      </p>
      {/* Breeds and Guides live here rather than in the nav, so this page is
          the way to both. */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-3xl mx-auto mt-10">
        <Link
          href="/guides"
          className="hover-lift flex-1 bg-white rounded-3xl shadow-soft border border-brand-tan/30 p-6 text-left"
        >
          <p className="font-display text-xl text-brand-brown mb-1">Guides</p>
          <p className="text-sm text-brand-brown/60">Where to start as a first-time owner.</p>
        </Link>
        <Link
          href="/breeds"
          className="hover-lift flex-1 bg-white rounded-3xl shadow-soft border border-brand-tan/30 p-6 text-left"
        >
          <p className="font-display text-xl text-brand-brown mb-1">Breeds</p>
          <p className="text-sm text-brand-brown/60">Origins, traits and temperament, breed by breed.</p>
        </Link>
      </div>
    </div>
  )
}
