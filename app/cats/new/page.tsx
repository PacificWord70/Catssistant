import CatForm from '@/components/CatForm'

export default function NewCatPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl text-brand-brown mb-8">Add a Cat</h1>
      <CatForm />
    </div>
  )
}
