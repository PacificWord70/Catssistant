import Link from 'next/link'
import { Cat } from '@/types/cat'
import { catHumanAge } from '@/lib/utils'

interface Props {
  cat: Cat
}

export default function CatCard({ cat }: Props) {
  return (
    <Link href={`/cats/${cat.id}`} className="block group">
      <div className="bg-white rounded-2xl shadow-sm border border-brand-tan/30 overflow-hidden group-hover:shadow-md group-hover:-translate-y-0.5 transition-all duration-200">
        <div className="h-44 bg-brand-tan/20 flex items-center justify-center overflow-hidden">
          {cat.photoUrl ? (
            <img
              src={cat.photoUrl}
              alt={cat.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-6xl select-none">🐱</span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg text-brand-charcoal leading-tight">{cat.name}</h3>
          {cat.breed.length > 0 && (
            <p className="text-sm text-brand-brown mt-0.5 truncate">{cat.breed.join(' · ')}</p>
          )}
          {cat.birthday && (
            <p className="text-xs text-gray-400 mt-2">
              ~{catHumanAge(cat.birthday)} in human years
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
