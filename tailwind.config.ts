import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: { ink: "#0b0b0c", charcoal: "#1a1a1d", gold: "#c9a24a", champagne: "#e8d9b0", ivory: "#f7f2e8" },
    fontFamily: { serif: ["Cormorant Garamond", "Georgia", "Times New Roman", "serif"], sans: ["Inter", "system-ui", "Segoe UI", "sans-serif"] },
  } },
  plugins: [],
} satisfies Config;
