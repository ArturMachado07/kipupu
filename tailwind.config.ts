import type { Config } from "tailwindcss";

// Paleta e tipografia extraídas de docs/brand/BRAND_GUIDE.md (identidade visual KIPUPU)
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kipupu: {
          navy: "#003A5D",
          cyan: "#27FFF7",
          blue: "#4A90E2",
          gray900: "#333333",
          gray100: "#F6F6F9",
        },
      },
      backgroundImage: {
        "kipupu-gradient":
          "linear-gradient(135deg, #003A5D 0%, #4A90E2 55%, #27FFF7 100%)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Poppins", "Montserrat", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "Poppins", "Montserrat", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "16px",
        lg: "24px",
      },
      boxShadow: {
        kipupu: "0 8px 24px rgba(0, 58, 93, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
