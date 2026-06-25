/**
 * Tailwind v4 is configured primarily from CSS (`app/globals.css`):
 * the semantic color tokens live in `@theme inline` and dark mode is a
 * class-based `@custom-variant`. This file only pins content sources and
 * the dark mode strategy.
 */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
};
