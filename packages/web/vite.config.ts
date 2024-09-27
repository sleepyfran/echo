import { defineConfig } from "vite";
import fs from "fs";

export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync("../../tools/certificates/key.pem"),
      cert: fs.readFileSync("../../tools/certificates/cert.pem"),
    },
    port: 4443,
  },
});
