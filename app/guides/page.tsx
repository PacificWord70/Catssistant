import Link from 'next/link'

const POSTS = [
  {
    title: 'Before You Bring Them Home',
    excerpt: 'Kitten-proofing checklist, essential supplies, and setting up a safe first room.',
  },
]

export default function GuidesPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/onboarding/getting-a-cat" className="text-brand-slate text-sm hover:underline mb-5 inline-block">
        ← Back
      </Link>
      <div className="text-center mb-10">
        <div className="text-6xl mb-4 select-none">📚</div>
        <h1 className="font-display text-3xl text-brand-brown mb-2">New Cat Owner Guides</h1>
        <p className="text-brand-brown/60 max-w-md mx-auto">
          A growing series to help first-time owners get ready — more posts coming soon.
        </p>
      </div>
      <div className="space-y-4">
        {POSTS.map(post => (
          <div key={post.title} className="bg-white rounded-3xl p-6 shadow-soft border border-brand-tan/30">
            <h2 className="font-display text-xl text-brand-brown mb-1">{post.title}</h2>
            <p className="text-brand-brown/60 text-sm">{post.excerpt}</p>
          </div>
        ))}
        <div className="bg-brand-tan/10 rounded-2xl p-6 text-center text-brand-brown/60 text-sm">
          More guides on the way — vet visits, litter training, and more.
        </div>
      </div>
    </div>
  )
}
