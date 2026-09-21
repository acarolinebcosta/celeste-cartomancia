import path from "node:path";
import { defineConfig } from "vitest/config";

const projectRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(projectRoot, "client", "src"),
    },
  },
  test: {
    environment: "jsdom",
    environmentOptions: { jsdom: { url: "http://localhost/" } },
    include: ["client/src/**/*.test.ts", "client/src/**/*.test.tsx"],
    setupFiles: ["client/src/test/setup.ts"],
    css: false,
  },
});
