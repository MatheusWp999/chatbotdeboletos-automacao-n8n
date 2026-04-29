/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          50: "#f8fafc",
          100: "#eef2f7",
          200: "#dbe3ef",
          700: "#32435e",
          900: "#112036"
        },
        whatsapp: {
          panel: "#0e1e34",
          accent: "#22c55e",
          bubble: "#d8fdd2",
          incoming: "#ffffff"
        }
      },
      boxShadow: {
        panel: "0 16px 40px rgba(17, 32, 54, 0.18)"
      }
    },
  },
  plugins: [],
}
