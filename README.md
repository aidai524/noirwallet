# Noir Wallet

Noir Wallet 官网：https://noirwallet.pages.dev/

## 目录

- `index.html` + `src/v2/`：官网首页（React，样式是普通 CSS）。
- `src/v2/extension/`：首页 "Try the extension" 的演示钱包，只用示例数据，没有真实的钱包或交易功能。
- `public/v2/`：官网里的钱包截图。
- `public/figma/`：Logo、代币和工具图标。Demo Day 页面和品牌规范也直接引用线上 `/figma/` 下的图片，删除或改名前先确认没有别处在用。
- `public/shield-and-win/`：Shield & Win 活动页，独立的静态页面。
- `public/_redirects`：旧的 `/v2` 地址跳回首页。

## 开发

```bash
npm install
npm run dev
```

## 发布

部署在 Cloudflare Pages 项目 `noirwallet`（生产分支 `main`），用 wrangler 直接上传构建产物：

```bash
npm run build
npx wrangler pages deploy dist --project-name noirwallet --branch main
```
