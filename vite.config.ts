import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      // index.html 是现有官网；v2.html 是按 Demo Day 方向 1 改版的新官网，确认后再替换首页。
      input: {
        index: fileURLToPath(new URL("./index.html", import.meta.url)),
        v2: fileURLToPath(new URL("./v2.html", import.meta.url)),
      },
    },
  },
});
