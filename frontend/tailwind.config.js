/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // --- 1. HỆ TOKEN MỚI TỪ DESIGN.MD (Dark & Emerald UI) ---
        surface: {
          app: 'rgb(var(--surface-app) / <alpha-value>)',
          card: 'rgb(var(--surface-card) / <alpha-value>)',
          elevated: 'rgb(var(--surface-elevated) / <alpha-value>)',
          border: 'rgb(var(--surface-border) / <alpha-value>)',
        },
        brand: {
          50: '#ECFDF5',
          500: '#10B981',       // Emerald chính cho button, active state
          600: '#059669',       // Hover state
        },
        // Role badges token
        role: {
          learner: '#818CF8',   // Indigo text
          admin: '#FBBF24',     // Amber text
        },

        // --- 2. BẢNG MÀU CŨ (Giữ lại để không lỗi các component hiện tại) ---
        background: 'rgb(var(--surface-app) / <alpha-value>)',
        'surface-container-lowest': 'rgb(var(--surface-card) / <alpha-value>)',
        'surface-container-low': 'rgb(var(--surface-low) / <alpha-value>)',
        'surface-container': 'rgb(var(--surface-elevated) / <alpha-value>)',
        'surface-container-high': 'rgb(var(--surface-high) / <alpha-value>)',
        'surface-container-highest': 'rgb(var(--surface-highest) / <alpha-value>)',
        'on-surface': 'rgb(var(--text-primary) / <alpha-value>)',
        'on-surface-variant': 'rgb(var(--text-secondary) / <alpha-value>)',
        primary: '#047857',
        'on-primary': '#FFFFFF',
        'primary-container': '#059669',
        'primary-fixed': '#A7F3D0',
        'secondary-container': 'rgb(var(--secondary-container) / <alpha-value>)',
        'on-secondary-container': 'rgb(var(--on-secondary-container) / <alpha-value>)',
        secondary: '#34D399',
        'secondary-fixed': '#ECFDF5',
        tertiary: '#465957',
        'tertiary-container': '#6b7775',
        'inverse-surface': '#090D16',
        'inverse-on-surface': '#F9FAFB',
        outline: 'rgb(var(--outline) / <alpha-value>)',
        'outline-variant': 'rgb(var(--outline-variant) / <alpha-value>)',
        'error-container': 'rgb(var(--error-container) / <alpha-value>)',
        error: 'rgb(var(--error) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Be Vietnam Pro', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 8px rgba(0, 0, 0, 0.04)',
        lift: '0 4px 16px -2px rgba(36, 55, 70, 0.05), 0 1px 2px rgba(36, 55, 70, 0.03)',
        modal: '0 20px 32px -8px rgba(36, 55, 70, 0.12), 0 4px 8px -2px rgba(36, 55, 70, 0.04)',
        // Shadow dạ quang nhẹ chuẩn Dark Mode
        glow: '0 0 20px -5px rgba(16, 185, 129, 0.25)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
