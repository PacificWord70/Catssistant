import Link from 'next/link'

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="text-8xl mb-6 select-none">🐱</div>
      <h2 className="font-display text-3xl text-brand-brown mb-3">No cats yet!</h2>
      <p className="text-gray-500 mb-8 max-w-sm">
        Add your first cat to start tracking their health, feeding, and more.
      </p>
      <Link
        href="/cats/new"
        className="px-6 py-3 bg-brand-orange text-white rounded-xl font-semibold hover:bg-brand-orange/90 transition-colors shadow-sm"
      >
        Add Your First Cat
      </Link>
    </div>
  )
}
