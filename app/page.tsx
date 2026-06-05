import CatTree from '@/components/CatTree'

export default function Home() {
  return (
    // Pull the tree to the edges, cancelling the layout's padding
    <div className="-mx-4 -my-8 min-h-screen bg-brand-cream overflow-hidden">
      <CatTree />
    </div>
  )
}
