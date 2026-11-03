import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Thirupathi Steels Industrial Brand Palette
        brand: {
          DEFAULT: '#008C84',
          50: '#F0F9F8',
          100: '#D5F0ED',
          200: '#AEE1DC',
          300: '#7ECDC6',
          400: '#40B2A9',
          500: '#008C84', // Primary brand color
          600: '#007A73',
          700: '#00655F',
          800: '#00524D',
          900: '#003E3A',
          950: '#002523',
        },
        steel: {
          DEFAULT: '#A7B0B7', // Secondary steel gray
          50: '#F5F7F7',      // Neutral background
          100: '#E9ECEE',
          200: '#D8DEE2',
          300: '#C2CBD1',
          400: '#A7B0B7',     // Approved Secondary
          500: '#7F8B94',
          600: '#5F6C75',
          700: '#465158',
          800: '#263238',     // Approved Accent Dark Slate
          900: '#1A2327',
          950: '#0F161A',
        },
        accent: {
          DEFAULT: '#263238', // Dark Slate Accent
          dark: '#1B2428',
          light: '#37474F',
        },
        neutral: {
          DEFAULT: '#F5F7F7', // Light Industrial Neutral
          50: '#FFFFFF',
          100: '#F5F7F7',
          200: '#EBEFEF',
          300: '#DDE2E2',
          400: '#C7CECE',
          500: '#9BA3A3',
        },
        status: {
          instock: '#0F8758',
          lowstock: '#D97706',
          outstock: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(38, 50, 56, 0.08), 0 1px 2px -1px rgba(38, 50, 56, 0.06)',
        'card-hover': '0 10px 25px -5px rgba(38, 50, 56, 0.12), 0 8px 10px -6px rgba(38, 50, 56, 0.08)',
        'brand': '0 4px 14px 0 rgba(0, 140, 132, 0.25)',
        'brand-hover': '0 6px 20px 0 rgba(0, 140, 132, 0.35)',
      },
      borderRadius: {
        'brand': '0.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
