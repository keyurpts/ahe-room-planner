import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import vitePluginInjectDataLocator from "./plugins/vite-plugin-inject-data-locator";
import basicSsl from "@vitejs/plugin-basic-ssl";
// Top-level obfuscator import removed to prevent dev server startup errors from nested dependencies
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The three-configurator library loads draco/basis assets.
// This plugin copies them to dist after every production build.
function copyConfiguratorAssets() {
  return {
    name: "copy-configurator-assets",
    apply: "build" as const,
    closeBundle() {
      const dracoSrc = path.resolve(
        __dirname,
        "../../Library/three-configurator/public/draco"
      );
      const dracoDest = path.resolve(__dirname, "dist/draco");
      fs.cpSync(dracoSrc, dracoDest, { recursive: true });

      const basisSrc = path.resolve(
        __dirname,
        "../../Library/three-configurator/public/basis"
      );
      const basisDest = path.resolve(__dirname, "dist/basis");
      fs.cpSync(basisSrc, basisDest, { recursive: true });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  let obfuscatorPlugin;
  if (mode === "obfuscated") {
    const obfuscator = (await import("vite-plugin-javascript-obfuscator")).default;
    obfuscatorPlugin = obfuscator({
      apply: "build",
      exclude: [/node_modules/, /dist-obfuscated/],
      options: {
        compact: true,
        disableConsoleOutput: true,
        stringArray: false,
        controlFlowFlattening: false,
        selfDefending: false,
      },
    });
  }

  return {
    plugins: [
      react(),
      basicSsl(),
      obfuscatorPlugin,
      copyConfiguratorAssets(),
    ],
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {
        "/api": {
          target: "http://172.16.17.185:5217",
          changeOrigin: true,
          secure: false,
        },
        "/devstoreaccount1": {
          target: "http://127.0.0.1:10000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
