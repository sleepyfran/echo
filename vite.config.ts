/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import fs from "fs";
import { viteStaticCopy } from "vite-plugin-static-copy";

const shoelaceIconsPath =
  "node_modules/@shoelace-style/shoelace/dist/assets/icons";

export default defineConfig(({ command }) => {
  const serverOptions =
    command == "serve"
      ? {
          https: {
            key: fs.readFileSync("./tools/certificates/key.pem"),
            cert: fs.readFileSync("./tools/certificates/cert.pem"),
          },
          port: 4443,
        }
      : {};

  return {
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
    resolve: {
      alias: [
        {
          find: /\/assets\/icons\/(.+)/,
          replacement: `${shoelaceIconsPath}/$1`,
        },
      ],
    },
    plugins: [
      viteStaticCopy({
        targets: [
          {
            src: shoelaceIconsPath,
            dest: "assets",
          },
        ],
      }),
    ],
    root: "./packages/web",
    worker: {
      format: "es",
    },
    server: serverOptions,
    test: {
      server: {},
      root: ".",
    },
  };
});
