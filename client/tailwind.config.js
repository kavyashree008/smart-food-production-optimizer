/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: {
          light: "#FAF8F4",
          dark: "#0F1A17"
        },
        surface: {
          light: "#FFFFFF",
          muted: "#F3F0EA",
          dark: "#162521",
          darkElevated: "#1D312C"
        },
        primary: {
          50: "#EBF5F2",
          100: "#D2E9E2",
          200: "#A6D3C6",
          300: "#74B9A5",
          400: "#449A83",
          500: "#1F6F5B",
          600: "#185B4A",
          700: "#13493C",
          800: "#0F382E",
          900: "#0A251F"
        },
        accent: {
          DEFAULT: "#F5A524",
          hover: "#E09319",
          soft: "#FEF4E6",
          dark: "#D98813"
        },
        danger: {
          DEFAULT: "#E5484D",
          soft: "#FDECEE",
          hover: "#CE3B40"
        },
        warning: {
          DEFAULT: "#F59E0B",
          soft: "#FEF3C7"
        },
        success: {
          DEFAULT: "#22C55E",
          soft: "#DCFCE7"
        },
        info: {
          DEFAULT: "#3B82F6",
          soft: "#DBEAFE"
        }
      },
      fontFamily: {
        heading: ["Sora", "sans-serif"],
        sans: ["Plus Jakarta Sans", "Inter", "sans-serif"]
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem"
      },
      boxShadow: {
        soft: "0 2px 10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)",
        card: "0 4px 20px -2px rgba(31, 111, 91, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.03)",
        cardDark: "0 4px 20px -2px rgba(0, 0, 0, 0.4)"
      }
    }
  },
  plugins: []
};
