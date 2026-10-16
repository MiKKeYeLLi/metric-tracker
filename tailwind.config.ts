import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        violet: "#8e6afa",
        "violet-deep": "#7551e8",
        "violet-tint": "#f0ecff",
        surface: "#fafaf9",
        "sidebar-bg": "#f3f1ee",
        sheet: "#ffffff",
        ink: "#1a1917",
        muted: "#706e69",
        line: "#e5e3df",
        "line-strong": "#cac8c3",
        live: "#16a34a",
        "live-bg": "#dcfce7",
        pending: "#d97706",
        "pending-bg": "#fef3c7",
        review: "#2563eb",
        "review-bg": "#dbeafe",
        rejected: "#dc2626",
        "rejected-bg": "#fee2e2",
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      keyframes: {
        "settle-in": {
          from: { opacity: "0", filter: "blur(8px)", transform: "translateY(10px)" },
          to: { opacity: "1", filter: "blur(0)", transform: "translateY(0)" },
        },
        "modal-fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "modal-scale-in": {
          from: { opacity: "0", transform: "translateY(6px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "dropdown-in": {
          from: { opacity: "0", transform: "translateY(-4px) scale(.97)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "overlay-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "sheet-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "settle-in": "settle-in 720ms cubic-bezier(.16,1,.3,1) both",
        "modal-fade-in": "modal-fade-in 150ms cubic-bezier(.16,1,.3,1) both",
        "modal-scale-in": "modal-scale-in 180ms cubic-bezier(.16,1,.3,1) both",
        "dropdown-in": "dropdown-in 120ms cubic-bezier(.16,1,.3,1) both",
        "overlay-in": "overlay-in 160ms ease both",
        "sheet-in": "sheet-in 200ms cubic-bezier(.16,1,.3,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
