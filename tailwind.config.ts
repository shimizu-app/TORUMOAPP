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
        green: {
          main: "#10B981",
          dark: "#059669",
          light: "#D1FAE5",
          light2: "#ECFDF5",
        },
        bg: "#EEF2EF",
        orange: {
          main: "#F97316",
          light: "#FFF4ED",
          dark: "#C2510A",
        },
      },
      fontFamily: {
        noto: ["Noto Sans JP", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        mplus: ["M PLUS 1p", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
