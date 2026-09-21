import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["server/**/*.test.ts"],
    testTimeout: 20_000,
    hookTimeout: 30_000,
    sequence: { concurrent: false },
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      include: ["server/domain/**/*.ts", "server/services/**/*.ts", "server/schemas/**/*.ts"],
      exclude: ["server/**/*.test.ts", "server/tests/**"],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70
      }
    }
  }
});
