/**
 * The Patreon paragraph in the Privacy section is written and ready, but parked
 * until we want to ask people for money. Flip this to true to bring it back.
 *
 * Kept in the file rather than deleted so the wording survives intact and does
 * not have to be rewritten or dug back out of git history.
 */
const SHOW_SUPPORT_NOTE: boolean = false

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-soft p-7 space-y-10">

        {/* Header */}
        <div className="text-center">
          <div className="text-5xl mb-3 select-none" aria-hidden="true">🐾</div>
          <h1 className="font-display text-4xl text-brand-brown">About Catssistant</h1>
          <p className="text-brand-tan mt-2 font-medium">The best assistant for cat owners</p>
        </div>

        {/* Why */}
        <section>
          <h2 className="font-display text-2xl text-brand-brown mb-3">Why</h2>
          <p className="text-brand-charcoal/80 leading-relaxed">
            Whether it&apos;s finding the right brush for a short-haired cat, figuring out which
            toys actually match your cat&apos;s playing style, searching for a sitter and having to
            re-explain care routines and medication schedules every time, or cross-referencing
            ingredient lists to find foods that work for a specific diet — we kept running into the
            same friction, over and over. So we built Catssistant. We wanted one place to understand everything in our
            cats&apos; lives — the products, the food, the care — and actually get the best for
            our little families.
          </p>
        </section>

        {/* What */}
        <section>
          <h2 className="font-display text-2xl text-brand-brown mb-3">What</h2>
          {/* Only what ships today goes in the first paragraph; everything else is
              named as planned. This page is where people decide whether to trust
              the app, so it must not describe features they then cannot find. */}
          <p className="text-brand-charcoal/80 leading-relaxed">
            Catssistant is a web-based cat care app built around having everything your cat needs
            in one place. You can create a profile for each of your cats and see them all together,
            keep a schedule of feeding, medication, vet visits, litter and grooming, follow each
            cat&apos;s weight over time on the Health page, keep track of the food and gear you use,
            and read up on breeds.
          </p>
          <p className="text-brand-charcoal/80 leading-relaxed mt-3">
            Still to come: guides for first-time owners, product recommendations for food, toys, and gear suited to your cats, a
            directory of nearby vets, emergency clinics, and boarding, accounts so your records can
            follow you between devices, and a mobile app.
          </p>
        </section>

        {/* Who */}
        <section>
          <h2 className="font-display text-2xl text-brand-brown mb-3">Who</h2>
          <p className="text-brand-charcoal/80 leading-relaxed">
            We&apos;re a small team of pet owners who wanted a better way to organize everything
            that comes with taking care of our animals. Pet care is something we&apos;re genuinely
            passionate about, and we wanted a space made for people like us — we&apos;re sure
            we&apos;re not alone.
          </p>
          <p className="text-brand-charcoal/80 leading-relaxed mt-3">
            Catssistant is built around cats. That&apos;s our focus, our love, and where
            every feature starts. That said, dogs are welcome here too — we know there&apos;s no
            shortage of spaces built for them, but cats are kind of our thing.
          </p>
          <p className="text-sm text-brand-tan font-medium mt-5 mb-3">Some of who we&apos;re building for —</p>
          {/* Photos live in public/images/pets/, the one exception to the no-images
              rule in .gitignore. Their metadata is stripped before they are added.
              The emoji below stay as a fallback if a file ever goes missing. */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { name: 'Polly', species: 'cat', src: '/images/pets/polly.jpg', alt: 'Polly, a black cat sitting upright on a ledge' },
              { name: 'Mabel', species: 'cat', src: '/images/pets/mabel.jpg', alt: 'Mabel, a black cat wearing an orange collar bell' },
              { name: 'Primrose', species: 'dog', src: '/images/pets/prim.jpg', alt: 'Primrose, a small white dog in a pink harness' },
              { name: 'Theo', species: 'dog', src: '/images/pets/theo.jpg', alt: 'Theo, a small white dog standing on grass' },
            ].map(({ name, species, alt, src }) => (
              <div key={name} className="flex flex-col items-center gap-1.5">
                <div className="aspect-square w-full rounded-2xl overflow-hidden bg-brand-tan/20 flex items-center justify-center">
                  {src ? (
                    <img src={src} alt={alt} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl select-none" aria-hidden="true">{species === 'cat' ? '🐱' : '🐶'}</span>
                  )}
                </div>
                <span className="text-xs text-brand-brown/60">{name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* How */}
        <section>
          <h2 className="font-display text-2xl text-brand-brown mb-3">How</h2>
          <p className="text-brand-charcoal/80 leading-relaxed">
            Catssistant was conceived and designed by humans, with all artwork human-made.
            The code was written by AI, thoughtfully directed and shaped by our team at every turn. We treat AI as a tool for
            bringing our vision to life — one that lets a small team build something they
            truly care about.
          </p>
          <p className="text-brand-charcoal/80 leading-relaxed mt-3">
            Under the hood it&apos;s a Next.js app written in TypeScript, styled with Tailwind, with
            Redux keeping your cats in sync across every page.
          </p>
        </section>

        {/* Privacy */}
        <section>
          <h2 className="font-display text-2xl text-brand-brown mb-3">Privacy</h2>
          {/* Kept plain and checkable. Accounts with server storage are planned, so
              nothing here may promise that data stays on the device, and every
              claim has to stay true once they arrive. */}
          <p className="text-brand-charcoal/80 leading-relaxed">
            Catssistant works from what you tell it about your cats. We don&apos;t sell your data,
            and there are no ads, ad trackers, or analytics in the app today.
          </p>
          <p className="text-brand-charcoal/80 leading-relaxed mt-3">
            Location is optional. You can type your city into a cat&apos;s profile yourself. If you
            press &ldquo;Detect my location&rdquo; instead, your browser asks for permission first,
            then your coordinates, rounded to about 1&nbsp;km, are sent to OpenStreetMap&apos;s
            Nominatim service to look up the city. Only the city, region, and country are saved to
            the profile; the coordinates are not kept.
          </p>
          <p className="text-brand-charcoal/80 leading-relaxed mt-3">
            The planned Shopping page will use affiliate links to help keep the app running.
            We&apos;ll explain exactly how that works here before it launches.
          </p>
          {SHOW_SUPPORT_NOTE && (
            <p className="text-brand-charcoal/80 leading-relaxed mt-3">
              If you&apos;d like to support Catssistant directly, we have a Patreon where you can
              contribute on your own terms. It means a lot and helps us keep building. And if you
              never donate, never click an ad, and never buy a thing — thank you for being here.
              That matters too.
            </p>
          )}
        </section>

      </div>
    </div>
  )
}
