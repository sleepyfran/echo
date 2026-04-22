/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import path from "path";

export default defineConfig(() => {
  return {
    resolve: {
      alias: {
        "~web": path.resolve(__dirname, "./packages/web/src"),
      },
    },

    build: {
      outDir: "../../dist",
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (
              id.includes("node_modules/music-metadata") ||
              id.includes("node_modules/buffer")
            ) {
              return "vendor-music-metadata";
            }

            if (
              id.includes("node_modules/effect") ||
              id.includes("node_modules/@effect")
            ) {
              return "vendor-effect";
            }
          },
        },
      },
    },
    root: "./packages/web",
    worker: {
      format: "es",
    },
    server: {
      port: 5173,
    },
    test: {
      server: {},
      root: ".",
    },
  };
});
