/** @type {import('tailwindcss').Config} */
import { nextui } from "@nextui-org/react";
import defaultTheme from "tailwindcss/defaultTheme";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
    screens: {
      xxs: "376px",
      xs: "460px",
      smd: "680px",
      slg: "880px",
      ...defaultTheme.screens,
    },
  },
  darkMode: "class",
  plugins: [nextui()],
};
