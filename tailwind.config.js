/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './content/**/*.{md,mdx}',
  ],
  // Blog tag colors (lib/tags.ts TAG_STYLES) are assembled into className
  // strings from a lookup object rather than written literally in JSX, so
  // belt-and-suspenders: safelist them explicitly in case the content glob
  // above ever stops covering lib/ or the lookup changes shape.
  safelist: [
    'bg-sky-300', 'text-sky-950',
    'bg-purple-300', 'text-purple-950',
    'bg-emerald-300', 'text-emerald-950',
    'bg-orange-300', 'text-orange-950',
    'bg-pink-300', 'text-pink-950',
    'bg-gray-300', 'text-gray-900',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: '#00ffd0',
        terminal: '#0f172a',
        metal: {
          50: '#f9fafb',
          100: '#e5e7eb',
          200: '#d1d5db',
          300: '#9ca3af',
          400: '#6b7280',
          500: '#4b5563',
          600: '#374151',
          700: '#1f2937',
          800: '#111827',
          900: '#030712',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        mono: ['var(--font-jetbrains-mono)'],
        pixel: ['var(--font-vt323)'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgb(0 255 208 / 0.5)' },
          '100%': { boxShadow: '0 0 20px rgb(0 255 208 / 0.8)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
