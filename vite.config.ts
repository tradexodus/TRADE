import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { tempo } from "tempo-devtools/dist/vite";
import fs from "fs";

const conditionalPlugins: [string, Record<string, any>][] = [];

// @ts-ignore
if (process.env.TEMPO === "true") {
  /* conditionalPlugins.push(["tempo-devtools/swc", {}]) [deprecated] */
}

// Ensure package.json path is correctly resolved
const packageJsonPath = path.resolve(__dirname, "./package.json");

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  optimizeDeps: {
    entries: ["src/main.tsx"],
  },
  plugins: [
    react({
      plugins: conditionalPlugins,
    }),
    tempo(),
  ],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Add alias for package.json to ensure it's found correctly
      "package.json": packageJsonPath,
    },
  },
  server: {
    // @ts-ignore
    allowedHosts: process.env.TEMPO === "true" ? true : undefined,
    host: process.env.TEMPO === "true" ? "0.0.0.0" : undefined,
    hmr: {
      overlay: false, // Disable HMR overlay for better debugging
    },
    fs: {
      // Allow serving files from one level up to the project root
      allow: ["..", "./"],
    },
  },
});
