import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 3333,
    strictPort: true,
  },
  build: {
    outDir: "build",
    emptyOutDir: true,
  },
});
