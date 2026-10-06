/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        red: {
          50:  'var(--red-light)',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: 'var(--red)',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        black: 'var(--black)',
        white: 'var(--white)',
        gray: {
          50:  'var(--gray-50)',
          100: 'var(--gray-100)',
          200: 'var(--gray-200)',
          300: '#d1d5db',
          400: 'var(--gray-400)',
          500: 'var(--gray-500)',
          600: '#4b5563',
          700: '#374151',
          800: 'var(--gray-800)',
          900: 'var(--gray-900)',
          950: '#030712',
        },
      },
      backdropBlur: {
        md: '12px',
      },
    },
  },
  plugins: [],
}
