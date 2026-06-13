/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#030a14",
          900: "#061827",
          800: "#0b2a3a"
        },
        electric: {
          500: "#00c2ff",
          400: "#35f5e6"
        }
      },
      boxShadow: {
        glow: "0 0 30px rgba(0, 194, 255, 0.32), 0 0 54px rgba(53, 245, 230, 0.18)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
};
