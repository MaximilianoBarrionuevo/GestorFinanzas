/** @type {import('tailwindcss').Config} */
export const content = [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
];
export const theme = {
  extend: {
    colors: {
      primary: '#2E6F40',
      secondary: '#CFFFDC',
      accent: '#A0D861',
      neutralDark: '#2D2D2D',
      neutralLight: '#F4F5F6',
    },
  },
};
export const plugins = [];
