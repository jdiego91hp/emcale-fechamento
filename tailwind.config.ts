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
        emcale: {
          green:  { DEFAULT: '#0D4A23', dark: '#0B3B1E', darker: '#082D16', light: '#1A6B35', 50: '#E8F5ED', 100: '#C2DECA' },
          red:    { DEFAULT: '#C41A1A', dark: '#9E1515', light: '#E53535', 50: '#FDEAEA', 100: '#F9BBBB' },
          yellow: { DEFAULT: '#F2C200', dark: '#C9A000', light: '#F7D340', 50: '#FFFBE6' },
        },
      },
      fontFamily: {
        sans:    ['Inter',  'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
