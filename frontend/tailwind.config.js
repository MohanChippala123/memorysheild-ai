/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0F1419',
        'dark-surface': '#1A1F2B',
        'dark-border': '#2A3142',
        'text-primary': '#FFFFFF',
        'text-secondary': '#A0AEC0',
        'severity-critical': '#EF4444',
        'severity-high': '#F59E0B',
        'severity-medium': '#FBBF24',
        'severity-low': '#6B7280',
      },
      backgroundColor: {
        'primary': '#0F1419',
        'surface': '#1A1F2B',
      },
      borderColor: {
        'default': '#2A3142',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
