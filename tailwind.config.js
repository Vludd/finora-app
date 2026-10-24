/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#070D0A",
        surface: "#101713",
        "surface-raised": "#17221B",
        "surface-soft": "#1C2A21",
        border: "#26372C",
        accent: "#20D994",
        "accent-dark": "#123B2A",
        "accent-muted": "#1B4934",
        foreground: "#F4F8F5",
        muted: "#97A49B",
        subtle: "#68786E",
        income: "#20D994",
        expense: "#FF737D",
        warning: "#F3C66B",
      },
    },
  },
  plugins: [],
};
