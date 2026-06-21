import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// `lib/` is framework-free (TC-PURE-01): default to the Node environment so any
// accidental DOM/React usage in a pure module fails its test. Component render
// tests use react-dom/server (renderToStaticMarkup), which also runs under Node.
// Component tests that need a live DOM opt in per-file with
// `// @vitest-environment jsdom`.
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirror the tsconfig `@/*` path alias so component tests can import
    // `@/lib/...` the same way the app does.
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    globals: true,
    environment: "node",
    include: [
      "lib/**/*.test.ts",
      "tests/**/*.test.{ts,tsx}",
      "components/**/*.test.tsx",
    ],
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
