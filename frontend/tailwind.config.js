/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ocean: {
          950: '#040812', // Deepest abyss
          900: '#070f22', // Command center background
          850: '#0b1633', // Deep panel background
          800: '#0f1f45', // Card and panel border / surface
          750: '#142756', // Elevated card surface
          700: '#1b336e', // Hover state
          600: '#25448f',
          500: '#345ab6',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          glow: 'rgba(6, 182, 212, 0.25)',
        },
        teal: {
          400: '#2dd4bf',
          500: '#14b8a6',
        },
        spill: {
          red: '#f43f5e',
          alert: '#ef4444',
          dark: '#881337',
        },
        warning: {
          amber: '#f59e0b',
          glow: 'rgba(245, 158, 11, 0.25)',
        },
        eco: {
          green: '#10b981',
          emerald: '#059669',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'ocean-glow': '0 0 25px -5px rgba(6, 182, 212, 0.25)',
        'spill-glow': '0 0 25px -5px rgba(239, 68, 68, 0.35)',
        'panel': '0 4px 20px -2px rgba(4, 8, 18, 0.7)',
      }
    },
  },
  plugins: [],
}
