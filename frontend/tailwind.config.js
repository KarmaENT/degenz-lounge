module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0EA5E9',
        secondary: '#3B82F6',
        background: '#111827',
        surface: '#1F2A44',
        'text-primary': '#F3F4F6',
        'text-secondary': '#9CA3AF',
        accent: '#FFFFFF',
        error: '#F97316',
        success: '#34D399',
        warning: '#EAB308',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
