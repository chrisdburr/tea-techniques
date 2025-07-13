// frontend/tailwind.config.ts
import type { Config } from "tailwindcss";
import typographyPlugin from "@tailwindcss/typography";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [
    typographyPlugin,
    // other plugins you might be using
  ],
};

export default config;
