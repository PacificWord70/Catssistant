import next from 'eslint-config-next'
import prettier from 'eslint-config-prettier'

/**
 * ESLint flat config.
 *
 * Next 16 removed `next lint` and no longer supplies config implicitly, so this
 * file has to exist — before it, `npm run lint` ran nothing at all.
 *
 * eslint-config-next exports a ready-made flat config array (Next + React +
 * TypeScript rules), so it spreads in rather than being called.
 */
const config = [
  ...next,

  // Must come last. This turns off the stylistic rules that would otherwise
  // disagree with Prettier — line length, quotes, semicolons. Formatting is
  // Prettier's job; ESLint's is catching real problems.
  prettier,

  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'next-env.d.ts', // generated, and regenerated on every build
      '.planning/**',
      'public/art-assets/**',
    ],
  },
]

export default config
