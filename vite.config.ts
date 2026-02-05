/// <reference types="vitest" />
import {defineConfig} from "vite";
import {resolve} from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/bin.ts"),
      formats: ["es"],
      fileName: () => "bin.js"
    },
    rollupOptions: {
      external: [
        /^node:.*/,
        "fs",
        "path",
        "os",
        "crypto",
        "http",
        "https",
        "url",
        "stream",
        "buffer",
        "util",
        "events",
        "assert",
        "commander",
        "chalk",
        "ethers",
        "@0xsequence/auth",
        "@0xsequence/network",
        "@0xsequence/relayer",
        "0xsequence"
      ]
    },
    target: "node18",
    minify: false,
    outDir: "dist",
    emptyOutDir: true
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
    testTimeout: 60000
  }
});
