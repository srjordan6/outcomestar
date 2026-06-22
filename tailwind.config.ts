import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0E1726", // deep navy — primary text
          soft: "#475569", // secondary
          fade: "#94A3B8", // captions / disabled
        },
        paper: "#FAFAF9", // warm white
        rule: "#E2E8F0", // borders / dividers
        accent: "#0891B2", // cyan-600 — single accent (links, PI value)
        gold: "#B45309", // amber-700 — sparingly, for medal emphasis
        good: "#047857", // emerald-700 — positive deltas
      },
      fontFamily: {
        display: ["Inter Tight", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      fontSize: {
        // Editorial scale — only the "hero" PI value uses 8xl
        "hero": ["7rem", { lineHeight: "0.95", letterSpacing: "-0.04em", fontWeight: "600" }],
      },
      letterSpacing: {
        eyebrow: "0.12em",
      },
      maxWidth: {
        page: "1240px",
      },
    },
  },
  plugins: [],
};

export default config;
