import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** GitHub Pages project site: /Leonel_Platform_Frontend/ */
const base = process.env.VITE_BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});
