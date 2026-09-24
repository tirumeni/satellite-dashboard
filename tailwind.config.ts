import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // ---------------------------------------------------------------
      // COLOR TOKENS — from the approved visual design system
      // ---------------------------------------------------------------
      colors: {
        // Base canvas
        canvas: {
          DEFAULT: "#0B1220", // page background, dark mode
          light: "#F7F8FA", // page background, light mode
        },
        // Surfaces
        surface: {
          DEFAULT: "#111827", // card / grounded surface
          light: "#FFFFFF",
        },
        // Primary brand / interactive accent
        primary: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          subtle: "rgba(37, 99, 235, 0.15)",
        },
        // Secondary accent (geo / cyan)
        secondary: {
          DEFAULT: "#0EA5E9",
        },
        // Change-type semantic colors (must stay consistent: map, legend, badges, cards)
        change: {
          vegetation: "#DC2626",
          water: "#0284C7",
          builtup: "#F59E0B",
          other: "#6B7280",
        },
        // System semantics
        success: "#16A34A",
        warning: "#D97706",
        danger: "#DC2626",
        // Text
        text: {
          primary: "#F1F5F9", // dark mode primary text
          "primary-light": "#0F172A", // light mode primary text
          muted: "rgba(241, 245, 249, 0.6)",
        },
        // Hairline borders / glass
        hairline: "rgba(255, 255, 255, 0.08)",
        "hairline-strong": "rgba(255, 255, 255, 0.16)",
      },

      // ---------------------------------------------------------------
      // TYPOGRAPHY
      // ---------------------------------------------------------------
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "'JetBrains Mono'",
          "'Roboto Mono'",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      fontSize: {
        // name: [size, { lineHeight, letterSpacing, fontWeight }]
        // display / display-sm — Phase 2 addition: landing-page hero scale,
        // larger than h1 (which stays reserved for in-app section headers).
        display: ["64px", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-sm": ["36px", { lineHeight: "1.15", letterSpacing: "-0.01em", fontWeight: "700" }],
        h1: ["32px", { lineHeight: "1.2", fontWeight: "600" }],
        h2: ["18px", { lineHeight: "1.3", fontWeight: "600" }],
        "label-micro": [
          "11px",
          { lineHeight: "1.4", letterSpacing: "0.05em", fontWeight: "500" },
        ],
        body: ["15px", { lineHeight: "1.6", fontWeight: "400" }],
        stat: ["36px", { lineHeight: "1.1", fontWeight: "700" }],
        meta: ["12px", { lineHeight: "1.4", fontWeight: "400" }],
        "button-label": ["14px", { lineHeight: "1.4", fontWeight: "500" }],
      },

      // ---------------------------------------------------------------
      // SPACING — 8px atomic scale
      // ---------------------------------------------------------------
      spacing: {
        micro: "4px",
        tight: "8px",
        std: "16px",
        section: "24px",
        major: "32px",
        xmajor: "40px",
      },

      // ---------------------------------------------------------------
      // BORDER RADIUS
      // ---------------------------------------------------------------
      borderRadius: {
        card: "12px",
        control: "8px",
        pill: "999px",
        tooltip: "6px",
      },

      // ---------------------------------------------------------------
      // SHADOWS — elevation scale L0–L4
      // ---------------------------------------------------------------
      boxShadow: {
        "elevation-1": "0 4px 12px rgba(0, 0, 0, 0.24)",
        "elevation-2": "0 8px 20px rgba(0, 0, 0, 0.32)",
        "elevation-3": "0 12px 32px rgba(0, 0, 0, 0.40)",
        "elevation-drawer": "-8px 0 24px rgba(0, 0, 0, 0.32)",
        "glow-primary": "0 0 0 4px rgba(37, 99, 235, 0.15)",
      },

      // ---------------------------------------------------------------
      // BLUR — glassmorphism substrate
      // ---------------------------------------------------------------
      backdropBlur: {
        glass: "16px",
        "glass-light": "12px",
        "glass-strong": "20px",
      },

      // ---------------------------------------------------------------
      // ANIMATIONS
      // ---------------------------------------------------------------
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-out-right": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
        // ---- Phase 2 additions: Landing page ambient / premium motion ----
        twinkle: {
          "0%, 100%": { opacity: "0.2", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(600%)" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "fade-scale-in": "fade-scale-in 150ms ease-out",
        "slide-in-right": "slide-in-right 250ms ease-out",
        "slide-out-right": "slide-out-right 200ms ease-in",
        // ---- Phase 2 additions ----
        twinkle: "twinkle 3.5s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
        scan: "scan 3s ease-in-out infinite",
        "gradient-x": "gradient-x 4s ease infinite",
        "spin-slow": "spin 90s linear infinite",
        "spin-slow-reverse": "spin 130s linear infinite reverse",
      },
      transitionDuration: {
        instant: "100ms",
        fast: "150ms",
        base: "200ms",
        drawer: "250ms",
      },
    },
  },
  plugins: [],
} satisfies Config;
