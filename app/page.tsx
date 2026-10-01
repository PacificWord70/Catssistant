import CatTree from '@/components/CatTree'
import Reveal from '@/components/motion/Reveal'
import Parallax from '@/components/motion/Parallax'

/* The drawing used to sit alone in a white card and carry the whole page.
   Set beside a headline it reads as an illustration someone chose, and it
   stands straight on the page background rather than in a frame. */
export default function Home() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 pb-16 pt-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-6 lg:pt-12">
      <Reveal className="mx-auto max-w-md text-center lg:mx-0 lg:text-left">
        {/* The nav bar is hidden on this page, so this is the only brand mark. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo-horizontal.png"
          alt="Catssistant"
          draggable={false}
          className="mx-auto w-48 select-none lg:mx-0"
        />
        <h1 className="mt-8 font-display text-4xl font-semibold leading-[1.05] text-brand-charcoal sm:text-5xl lg:text-6xl">
          Everything your cat needs, on one tree.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-brand-brown">
          Profiles, care schedules and health records for every cat in your home, all in one
          place.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <Parallax offset={20}>
          <CatTree />
        </Parallax>
      </Reveal>
    </section>
  )
}
