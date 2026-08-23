# Catssistant

A cat care assistant app that helps you keep your feline friends happy and healthy.

## Features

- **Feeding tracker** — Log meals and set feeding reminders so your cat never misses a meal.
- **Health log** — Record vet visits, vaccinations, medications, and weight over time.
- **Behavior notes** — Track mood, activity, and any unusual behavior to share with your vet.
- **Litter box reminders** — Get reminders to clean the litter box on a schedule.
- **Care tips** — Browse advice on nutrition, grooming, enrichment, and common health concerns.

## Getting Started

1. Clone the repository.
2. Install dependencies.
3. Run the app and create a profile for each of your cats.

## Contributing

Pull requests are welcome. Please open an issue first to discuss any major changes.
At least from us three.

## Deployment

Hosted on **Vercel**. Pushes to `main` deploy automatically once the GitHub
integration is connected.

### Why Vercel, and how to leave

Next.js 16 is newer than most hosts support. AWS Amplify caps at Next 15, and
Firebase App Hosting's preconfigured support stops at 15.2. Vercel and Netlify
both run 16 today; Vercel was chosen because it needs no configuration.

Nothing in this repo is tied to it:

- no `vercel.json` or any other host config file
- no `@vercel/*` packages
- `next.config.mjs` is empty
- no API routes and no server-side data — every page renders in the browser
  from localStorage

Switching to Netlify is connecting the repo and letting its Next runtime build
it. Switching to AWS or Firebase App Hosting needs their Next version support to
catch up first.

**Keep it that way.** Before reaching for a Vercel primitive — Vercel Postgres,
Blob, KV — check whether a host-neutral option does the same job. The moment one
of those lands, leaving stops being free.

One thing to know for later: Vercel's free tier is non-commercial only. Ads,
affiliate links and donation links all count, so the Shopping page going live
means moving to a paid plan or a different host.

### Node version

Pinned in `.nvmrc` and in `engines`. Vercel, Netlify, Amplify and Firebase all
read one or both, so the build runs on the same major version everywhere.

### Backend

There isn't one yet — all data lives in the browser's localStorage. Firebase
(Auth, Firestore, Cloud Storage) is the intended direction once accounts and
photo storage are needed. Firebase runs independently of the host, so picking it
does not disturb any of the above.
