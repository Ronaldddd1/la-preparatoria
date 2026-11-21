/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        marino: {
          50: '#eef1f7',
          100: '#d7deec',
          200: '#b0bfd9',
          300: '#62759f',
          400: '#4a5f8c',
          500: '#3d5280',
          600: '#2c3d63',
          700: '#1B2A4A',
          800: '#131f38',
          900: '#041534',
        },
        rojo: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#f7a3a3',
          400: '#E4202A',
          500: '#c31d26',
          600: '#9c161d',
        },
        esmeralda: {
          50: '#ecfdf5',
          100: '#d1fae5',
          300: '#6ee7b7',
          400: '#10b981',
          500: '#059669',
          600: '#047857',
        },
        ambar: {
          50: '#fffbeb',
          100: '#fef3c7',
          300: '#fcd34d',
          400: '#f59e0b',
          500: '#d97706',
        },
        papel: '#FAF7F2',
      },
      fontFamily: {
        display: ['"Newsreader"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(27, 42, 74, 0.08), 0 8px 24px -8px rgba(27, 42, 74, 0.10)',
        glow: '0 0 0 1px rgba(228, 32, 42, 0.08), 0 8px 30px -8px rgba(228, 32, 42, 0.25)',
      },
      backgroundImage: {
        'mesh-hero': 'radial-gradient(at 20% 20%, rgba(228,32,42,0.35) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(16,185,129,0.25) 0px, transparent 50%), radial-gradient(at 80% 90%, rgba(228,32,42,0.25) 0px, transparent 50%), radial-gradient(at 0% 80%, rgba(59,88,150,0.35) 0px, transparent 50%)',
      },
    },
  },
  plugins: [],
};
