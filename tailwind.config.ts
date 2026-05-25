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
          cream: '#FAFAF5',
          tan: '#C4956A',
          brown: '#8B5E3C',
          orange: '#E8761E',
          slate: '#5B7FA6',
          charcoal: '#1F1F1F',
        },
      },
      fontFamily: {
        sans: ['var(--font-figtree)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-tapestry)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
