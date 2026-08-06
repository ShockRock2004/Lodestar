/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ground: '#0b0b0b',
        ground2: '#050506',
        card: 'rgba(255,255,255,0.018)',
        line: '#242424',
        ink: '#ededed',
        ink2: '#a1a1a1',
        ink3: '#7a7a7a',
        easy: '#00b8a3',
        med: '#ffc01e',
        hard: '#ff375f',
      },
    },
  },
  plugins: [],
};
