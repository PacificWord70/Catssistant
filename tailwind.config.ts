import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          cream: '#FFFBF6',
          tan: '#E7C9A9',
          brown: '#6B4A34',
          orange: '#F26A1B',
          slate: '#5F8AA8',
          charcoal: '#2B2622',
        },
      },
      fontFamily: {
        sans: ['var(--font-figtree)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 2px 12px -2px rgba(43, 38, 34, 0.08)',
        card: '0 6px 24px -6px rgba(43, 38, 34, 0.12)',
      },
    },
  },
  plugins: [],
}

export default config
