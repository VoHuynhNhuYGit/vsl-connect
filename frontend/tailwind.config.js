/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#f3f7f8',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#ecf5ff',
        'surface-container': '#e1f0ff',
        'surface-container-high': '#d6ebfe',
        'surface-container-highest': '#d1e5f8',
        'on-surface': '#091d2b',
        'on-surface-variant': '#344b50',
        primary: '#166664',
        'on-primary': '#ffffff',
        'primary-container': '#286f6c',
        'primary-fixed': '#a7efec',
        'secondary-container': '#acebe7',
        'on-secondary-container': '#174e4c',
        secondary: '#276865',
        'secondary-fixed': '#afeeea',
        tertiary: '#465957',
        'tertiary-container': '#6b7775',
        'inverse-surface': '#1f3241',
        'inverse-on-surface': '#e6f2ff',
        outline: '#6f7978',
        'outline-variant': '#bec9c7',
        'error-container': '#ffdad6',
        error: '#ba1a1a',
      },
      fontFamily: {
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 8px rgba(0, 0, 0, 0.04)',
        lift: '0 4px 16px -2px rgba(36, 55, 70, 0.05), 0 1px 2px rgba(36, 55, 70, 0.03)',
        modal: '0 20px 32px -8px rgba(36, 55, 70, 0.12), 0 4px 8px -2px rgba(36, 55, 70, 0.04)',
      },
    },
  },
  plugins: [],
};
