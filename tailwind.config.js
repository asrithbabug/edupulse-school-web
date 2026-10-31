/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#5B5FC7',
        background: '#F8FAFB',
        card: '#FFFFFF',
        'text-primary': '#101828',
        'text-secondary': '#475467',
        'text-muted': '#98A2B3',
        border: '#D0D5DD',
        success: '#12B76A',
        danger: '#F04438',
        warning: '#F79009',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
