/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        void: '#0b0d12',
        surface: '#12151c',
        elevated: '#1a1e28',
        overlay: '#222733',
        steam: {
          DEFAULT: '#66c0f4',
          deep: '#1b9de2',
          glow: 'rgba(102, 192, 244, 0.15)',
        },
        hot: '#ff6b35',
        accent: {
          success: '#4ade80',
          warning: '#fbbf24',
          danger: '#ef4444',
          purple: '#c084fc',
        },
        text: {
          primary: '#e4e8f1',
          secondary: '#8b93a7',
          muted: '#4a5168',
        },
        border: {
          subtle: '#1e2230',
          accent: 'rgba(102, 192, 244, 0.15)',
        },
      },
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],
        body: ['Exo 2', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': '#e4e8f1',
            '--tw-prose-headings': '#e4e8f1',
            '--tw-prose-links': '#66c0f4',
            '--tw-prose-bold': '#e4e8f1',
            '--tw-prose-counters': '#8b93a7',
            '--tw-prose-bullets': '#4a5168',
            '--tw-prose-hr': '#1e2230',
            '--tw-prose-quotes': '#8b93a7',
            '--tw-prose-quote-borders': '#66c0f4',
            '--tw-prose-code': '#66c0f4',
            '--tw-prose-pre-bg': '#12151c',
            '--tw-prose-th-borders': '#1e2230',
            '--tw-prose-td-borders': '#1e2230',
            maxWidth: 'none',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
