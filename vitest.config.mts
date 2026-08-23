import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

/**
 * The `@/` alias is declared in tsconfig.json, which Vitest does not read.
 * Without repeating it here every `@/lib/...` import in a test fails to resolve.
 */
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  test: {
    // These suites cover pure logic in lib/ — no DOM, so the lighter node
    // environment is enough and starts faster.
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
})
