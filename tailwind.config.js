/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#060714',
        'nebula-deep': '#1A1233',
        'nebula-violet': '#8B6FE8',
        'aurora-teal': '#4FD8C4',
        'stardust-pink': '#E88FD1',
        'comet-gold': '#F5C86B',
        starlight: '#EDEBFF',
        muted: '#A6A3C4',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      keyframes: {
        'giga-twinkle': {
          '0%, 100%': { opacity: '0.15' },
          '50%': { opacity: '0.9' },
        },
      },
      animation: {
        'giga-twinkle': 'giga-twinkle 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
