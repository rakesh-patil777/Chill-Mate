import { defineConfig } from "vite";

const isVercel = process.env.VERCEL === "1";

export default defineConfig({
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: isVercel ? "dist" : "../server/public",
    emptyOutDir: isVercel,
  },
});

