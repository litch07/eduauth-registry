module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E40AF',
          hover: '#1E3A8A',
          light: '#3B82F6',
        },
        secondary: {
          DEFAULT: '#059669',
          hover: '#047857',
        },
        danger: {
          DEFAULT: '#DC2626',
          hover: '#B91C1C',
        },
        success: {
          DEFAULT: '#10B981',
          hover: '#059669',
        },
      },
    },
  },
  plugins: [],
}

