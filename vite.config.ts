// CONFIGURACIÓN DE VITE: REACT, TAILWIND Y EMPAQUETADO DE LA EXTENSIÓN CON @crxjs.
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./src/manifest";

export default defineConfig({
  plugins: [react(), tailwindcss(), crx({ manifest })],
  resolve: {
    // ALIAS "@" -> ./src
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
});
