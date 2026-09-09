/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom DevOS color scheme
        devos: {
          bg: 'var(--devos-bg)',
          surface: 'var(--devos-surface)',
          'surface-hover': 'var(--devos-surface-hover)',
          border: 'var(--devos-border)',
          text: 'var(--devos-text)',
          'text-secondary': 'var(--devos-text-secondary)',
          accent: 'var(--devos-accent)',
          'accent-hover': 'var(--devos-accent-hover)',
          success: 'var(--devos-success)',
          warning: 'var(--devos-warning)',
          error: 'var(--devos-error)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
