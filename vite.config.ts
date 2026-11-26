import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// 首页 index.html 就是新版官网（src/v2）。原来的 /v2 地址由 public/_redirects 跳回首页。
// 旧版 Figma 首页（src/main.tsx、App.tsx 等）已不再构建；Tailwind 只有它在用。
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
