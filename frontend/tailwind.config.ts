import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#001f3f',
          light: '#003d7a',
          dark: '#001529',
        },
        secondary: '#ffffff',
        accent: '#0074d9',
        text: {
          DEFAULT: '#333333',
          light: '#666666',
        },
      },
      spacing: {
        unit: '0.25rem', // 4px base
      },
    },
  },
  plugins: [],
};

export default config;

