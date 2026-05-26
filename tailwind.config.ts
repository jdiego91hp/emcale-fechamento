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
          green: {
            DEFAULT: '#009C3B',
            dark: '#006B2A',
            light: '#00BF47',
            50: '#E6F7ED',
            100: '#C2EBD0',
          },
          yellow: {
            DEFAULT: '#FEDF00',
            dark: '#D4B900',
            light: '#FFF176',
          },
          red: {
            DEFAULT: '#D32F2F',
            dark: '#B71C1C',
            light: '#EF5350',
          },
        },
      },
      // Fix 5: variáveis CSS corretas definidas em globals.css
      fontFamily: {
        sans:    ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-syne)',    'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
