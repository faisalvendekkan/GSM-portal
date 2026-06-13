/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#07120c",
          900: "#0b1a18",
          800: "#0f2c28"
        },
        electric: {
          500: "#00b72f",
          400: "#29e85a"
        }
      },
      boxShadow: {
        glow: "0 0 28px rgba(0, 183, 47, 0.28), 0 0 52px rgba(0, 104, 145, 0.18)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
};
