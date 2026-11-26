import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// 首页 index.html 就是官网（src/v2）。原来的 /v2 地址由 public/_redirects 跳回首页。
export default defineConfig({
  plugins: [react()],
});
