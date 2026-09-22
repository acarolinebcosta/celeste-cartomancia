import path from "node:path";
import { defineConfig } from "vitest/config";

const projectRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  define: {
    "import.meta.env.VITE_USE_MOCK_API": JSON.stringify("true"),
    "import.meta.env.PROD": JSON.stringify(false),
  },
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
