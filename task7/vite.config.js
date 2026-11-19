import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { generateServiceWorker } from "./sw-src/generate-sw.js";

// After the build, write dist/sw.js with the list of built files to pre-cache.
function serviceWorkerPlugin() {
  let root = process.cwd();
  let outDir = "dist";
  return {
    name: "generate-service-worker",
    apply: "build",
    configResolved(config) {
      root = config.root;
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const { version, count } = generateServiceWorker({ root, outDir });
      console.log(`[sw] dist/sw.js generated: version ${version}, ${count} files pre-cached`);
    },
  };
}

// base "/" is required: with nested URLs like /tasks/3 relative asset paths would break.
export default defineConfig({
  plugins: [react(), serviceWorkerPlugin()],
  base: "/",
});
