import type { Config } from "tailwindcss";
const defaultTheme = require('tailwindcss/defaultTheme');

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#6C63FF',
          'purple-light': '#8B85FF',
          teal: '#00E5C3',
          pink: '#FF6B9D',
          amber: '#F59E0B',
        },
        dark: {
          900: '#060612',
          800: '#0D0D18',
          700: '#161628',
          600: '#1E1E38',
        },
        nf: {
          bg: {
            primary: '#060612',
            secondary: 'rgba(255, 255, 255, 0.04)',
            tertiary: 'rgba(255, 255, 255, 0.03)',
          },
          cyan: '#00E5C3',
          violet: '#6C63FF',
          red: '#EF4444',
          green: '#10B981',
          amber: '#F59E0B',
          text: {
            primary: '#E0E0FF',
            secondary: '#B0B0E0',
            tertiary: '#6060A0',
            faint: '#5A5A7A',
          },
          border: {
            default: 'rgba(255, 255, 255, 0.08)',
            accent: 'rgba(108, 99, 255, 0.4)',
            glow: 'rgba(108, 99, 255, 0.5)',
          },
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
      },
      animation: {
        'pulse-slow': 'pulse-slow 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'ticker': 'ticker 30s linear infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 2s infinite',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 0 1px rgba(108, 99, 255, 0.2), 0 0 20px rgba(108, 99, 255, 0.05)' },
          '50%': { boxShadow: '0 0 0 1px rgba(108, 99, 255, 0.5), 0 0 30px rgba(108, 99, 255, 0.15)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        'pulse-dot': {
          '0%, 100%': { boxShadow: '0 0 0 0 currentColor', opacity: '1' },
          '50%': { boxShadow: '0 0 0 4px transparent', opacity: '0.7' },
        },
      },
      boxShadow: {
        'nf-glow': '0 0 0 1px rgba(108, 99, 255, 0.4), 0 8px 32px rgba(108, 99, 255, 0.08)',
        'nf-glow-lg': '0 0 0 1px rgba(108, 99, 255, 0.6), 0 12px 40px rgba(108, 99, 255, 0.15)',
      },
    },
  },
  plugins: [],
};
export default config;
