/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Note: most colors use CSS variables directly in inline styles.
      // These classes are kept for Tailwind utility use only.
      screens: {
        xs: '480px',
      },
    },
  },
  plugins: [],
  // Safelist classes used dynamically
  safelist: [
    'md:hidden',
    'lg:hidden',
    'lg:flex',
    'xl:flex',
    'xl:block',
    'xl:hidden',
    'animate-fade-in',
    'animate-slide-up',
    'animate-feed-item',
  ],
};
