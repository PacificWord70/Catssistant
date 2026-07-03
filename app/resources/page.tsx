import Link from 'next/link'

export default function ResourcesPage() {
  return (
    <div className="text-center py-24">
      <div className="text-7xl mb-6 select-none">🔗</div>
      <h1 className="font-display text-3xl text-brand-brown mb-2">Resources</h1>
      <p className="text-gray-400 max-w-sm mx-auto">
        Nearby vets, emergency clinics, boarding, adoption sites, and external links — coming soon!
      </p>
      <p className="text-gray-400 max-w-sm mx-auto mt-4">
        New to cats?{' '}
        <Link href="/guides" className="text-brand-slate hover:underline">
          Check out our guides for first-time owners
        </Link>.
      </p>
    </div>
  )
}
