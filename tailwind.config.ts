import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#000000',
        paper: '#FFFFFF',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        // All set to natural (0) — matches the Coolvetica wordmark SVG
        // which uses opentype.js native kerning with no CSS overrides.
        tightest: '0',
        tighter: '0',
        tight: '0',
      },
      fontSize: {
        'hero': ['clamp(3.5rem, 9vw, 8.5rem)', { lineHeight: '1', letterSpacing: '0' }],
        'mega': ['clamp(3rem, 10vw, 9rem)', { lineHeight: '1', letterSpacing: '0' }],
        'section': ['clamp(2.5rem, 7vw, 6rem)', { lineHeight: '1', letterSpacing: '0' }],
      },
      transitionTimingFunction: {
        'silk': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'expo-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
