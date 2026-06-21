import { defineConfig } from "vitest/config";

// `lib/` is framework-free (TC-PURE-01): default to the Node environment so any
// accidental DOM/React usage in a pure module fails its test. Component tests
// that need a DOM opt in per-file with `// @vitest-environment jsdom`.
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["lib/**/*.test.ts", "tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "json"],
      // Ratchet coverage on the pure domain logic only — that is where
      // correctness lives and where 100% testability is required.
      include: ["lib/**/*.ts"],
      exclude: ["lib/**/*.test.ts", "lib/**/index.ts"],
    },
  },
});
