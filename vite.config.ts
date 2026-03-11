import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

const conditionalPlugins: [string, Record<string, any>][] = [];

// @ts-ignore
if (process.env.TEMPO === "true") {
  /* conditionalPlugins.push(["tempo-devtools/swc", {}]) [deprecated] */
}

// Ensure package.json path is correctly resolved
const packageJsonPath = path.resolve(__dirname, "./package.json");

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const plugins: any[] = [
    react({
      plugins: conditionalPlugins,
    }),
  ];

  if (process.env.TEMPO === "true") {
    const { tempo } = await import("tempo-devtools/dist/vite");
    plugins.push(tempo());
  }

  return {
    base: "/",
    optimizeDeps: {
      entries: ["src/main.tsx"],
    },
    plugins,
    resolve: {
      preserveSymlinks: true,
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "package.json": packageJsonPath,
      },
    },
    server: {
      // @ts-ignore
      allowedHosts: process.env.TEMPO === "true" ? true : undefined,
      host: process.env.TEMPO === "true" ? "0.0.0.0" : undefined,
      hmr: {
        overlay: false,
      },
      fs: {
        allow: ["..", "./"],
      },
    },
  };
});
