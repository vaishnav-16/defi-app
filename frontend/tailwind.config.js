/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Editorial-financial palette.
      // Cream for narrative pages, ink-navy for the app, warm ochre accents.
      colors: {
        paper: {
          DEFAULT: "#faf7f2",
          soft: "#f3ede2",
          rule: "#e5dcc9",
        },
        ink: {
          50: "#f5f5f4",
          100: "#e7e5e4",
          300: "#a8a29e",
          500: "#57534e",
          700: "#292524",
          900: "#1c1917",
          950: "#0c0a09",
        },
        navy: {
          DEFAULT: "#0b1220",
          soft: "#111a2e",
          rule: "#1f2a44",
        },
        ochre: {
          DEFAULT: "#c77a2a",
          soft: "#e9a961",
          deep: "#8f5615",
        },
        terracotta: "#b5583e",
        sage: "#6b7f5c",
      },
      fontFamily: {
        display: ['"Fraunces"', '"Fraunces Fallback"', "serif"],
        body: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', '"Fira Code"', "monospace"],
      },
      fontSize: {
        kicker: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.14em" }],
        "display-xl": ["5.5rem", { lineHeight: "0.95", letterSpacing: "-0.025em" }],
        "display-lg": ["4rem", { lineHeight: "1", letterSpacing: "-0.02em" }],
        "display-md": ["2.75rem", { lineHeight: "1.05", letterSpacing: "-0.015em" }],
        "display-sm": ["1.875rem", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
      },
      letterSpacing: {
        kicker: "0.14em",
      },
      boxShadow: {
        inset: "inset 0 0 0 1px rgba(255,255,255,0.06)",
        card: "0 1px 2px rgba(11,18,32,0.04), 0 12px 32px -12px rgba(11,18,32,0.12)",
      },
      animation: {
        "rise-in": "riseIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fadeIn 0.5s ease-out both",
        "pulse-soft": "pulseSoft 2.4s ease-in-out infinite",
        "drain-progress": "drainProgress linear forwards",
      },
      keyframes: {
        riseIn: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        meterSweep: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(380%)" },
        },
        drainProgress: {
          "0%": { transform: "scaleX(1)" },
          "100%": { transform: "scaleX(0)" },
        },
      },
    },
  },
  plugins: [],
};
