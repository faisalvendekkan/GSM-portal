/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#06111f",
          900: "#0a1728",
          800: "#10243a"
        },
        electric: {
          500: "#1b8cff",
          400: "#42a5ff"
        }
      },
      boxShadow: {
        glow: "0 0 28px rgba(27, 140, 255, 0.28)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
};
