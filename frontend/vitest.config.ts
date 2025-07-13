import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    css: true,
    exclude: ["**/e2e/**", "**/node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/tests/setup.ts",
        "**/*.d.ts",
        "**/*.config.ts",
        "**/*.config.js",
        "src/app/layout.tsx", // Next.js layout
        "src/app/globals.css", // CSS files
        "src/lib/utils.ts", // Utility functions (test separately if complex)
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 85,
          statements: 85,
        },
        // Per-file thresholds for critical components
        "src/components/": {
          branches: 75,
          functions: 85,
          lines: 80,
          statements: 80,
        },
        "src/lib/": {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
      // Fail the build if thresholds are not met
      reportOnFailure: true,
    },
    // Performance configuration
    testTimeout: 10000,
    hookTimeout: 10000,
    // Better error output
    reporters: ["verbose", "html"],
    outputFile: {
      html: "./coverage/index.html",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/app": path.resolve(__dirname, "./src/app"),
    },
  },
});
