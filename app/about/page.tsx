export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-soft p-7 space-y-10">

        {/* Header */}
        <div className="text-center">
          <div className="text-5xl mb-3 select-none">🐾</div>
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
          <p className="text-brand-charcoal/80 leading-relaxed">
            Catssistant is a web-based cat care app built around having everything your cat needs
            in one place. You can create profiles for each of your cats and manage them all from a central
            dashboard. Beyond profiles, the app covers scheduling for vet appointments and health
            events, product recommendations for food, toys, and gear customized for your cats, cat
            breed information, and a directory of vets, emergency clinics, and boarding facilities
            in your area.
          </p>
          <p className="text-brand-charcoal/80 leading-relaxed mt-3">
            Coming soon: an in-app feeding tracker, health log, litter reminders, medication
            schedule, and a mobile app.
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
          {/* Pet photos — replace src values when photos are ready */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { name: 'Mabel', alt: 'Cat 1', src: null },
              { name: 'Polly', alt: 'Cat 2', src: null },
              { name: 'Theo',  alt: 'Dog 1', src: null },
              { name: 'Primrose', alt: 'Dog 2', src: null },
            ].map(({ name, alt, src }) => (
              <div key={name} className="flex flex-col items-center gap-1.5">
                <div className="aspect-square w-full rounded-2xl overflow-hidden bg-brand-tan/20 flex items-center justify-center">
                  {src ? (
                    <img src={src} alt={alt} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl select-none">{alt.startsWith('Cat') ? '🐱' : '🐶'}</span>
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
            Redux keeping your cats in sync across every page. For now your data lives in your own
            browser rather than on our servers — no account, nothing to sign up for — which is part
            of why the privacy promise below is an easy one to keep.
          </p>
        </section>

        {/* Privacy */}
        <section>
          <h2 className="font-display text-2xl text-brand-brown mb-3">Privacy</h2>
          <p className="text-brand-charcoal/80 leading-relaxed">
            Your privacy matters to us. Catssistant never tracks your location or behavior — the
            app is powered entirely by information you choose to share in your profile. Your data
            is yours. We will never sell it, share it, or use it for anything other than making
            the app work for you.
          </p>
          <p className="text-brand-charcoal/80 leading-relaxed mt-3">
            To keep the app running, the Shopping page includes contextual ads and affiliate links
            — meaning any ads or product recommendations are chosen based on the products or category you&apos;re
            viewing, not your personal profile or behavior. We do not use behavioral tracking,
            retargeting, or third-party data brokers. What you do on Catssistant stays on
            Catssistant.
          </p>
          <p className="text-brand-charcoal/80 leading-relaxed mt-3">
            If you&apos;d like to support Catssistant directly, we have a Patreon where you can
            contribute on your own terms. It means a lot and helps us keep building. And if you
            never donate, never click an ad, and never buy a thing — thank you for being here.
            That matters too.
          </p>
        </section>

      </div>
    </div>
  )
}
