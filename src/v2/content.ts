/** 新版官网的文案与素材。文案沿用设计稿，钱包截图是设计稿导出的图。 */
import type { CSSProperties } from "react";

const F = "/figma/";
const V = "/v2/";

export const IMG = {
  logo: `${F}imgNoirLogo1.jpg`,
  // 演示钱包（Try the extension）里用到的代币和链图标
  usdt: `${F}imgImage4.png`,
  usdc: `${F}imgImage3.png`,
  eth: `${F}imgImage1049.png`,
  zecCoin: `${F}imgGroup1948762978.svg`,
  aave: `${F}imgImage1045.png`,
  ethChip: `${F}imgImage902.png`,
  arbChip: `${F}imgGroup1948761781.svg`,
  bnbChip: `${F}imgGroup1948761777.svg`,
  // How Noir Wallet Works 中间的护盾
  shieldGlyph: `${F}imgGroup1948763176.svg`,
} as const;

/** 设计稿里手机框的宽度（CSS px）。 */
export const PHONE_WIDTH = 375;

/**
 * 设计稿导出的钱包图（2 倍图，透明底）：四周留了阴影的空白，有的还带伸出手机框的标注，
 * 底部的模糊淡出也已经做在图里。frame 是手机框左上角在图里的位置（CSS px），
 * 放进页面时按手机框对齐，见 frameStyle。
 */
export type PhoneShot = { src: string; width: number; height: number; frame: { x: number; y: number } };

export const PHONES = {
  /** 首屏：Shield 账户首页。 */
  hero: { src: `${V}hero-wallet.webp`, width: 435, height: 754, frame: { x: 30, y: 30 } },
  /** Send Privately：首页，Send / Receive 按钮放大标出（向左伸出手机框）。 */
  send: { src: `${V}send-privately.webp`, width: 464, height: 667, frame: { x: 79, y: 10 } },
  /** Receive Privately：收款地址页，二维码和地址都是糊的。 */
  receive: { src: `${V}receive-privately.webp`, width: 395, height: 667, frame: { x: 10, y: 10 } },
  /** Shield & Unshield：Public 账户，ZEC 那一行连同一键 Shield 按钮放大标出（向两边伸出手机框）。 */
  shieldToken: { src: `${V}shield-token.webp`, width: 558, height: 754, frame: { x: 96, y: 30 } },
} as const satisfies Record<string, PhoneShot>;

/** 容器宽度就是手机框的宽度：图按比例放大，再往左上挪掉留白，手机框正好落在容器里。 */
export function frameStyle(shot: PhoneShot): CSSProperties {
  const k = 100 / PHONE_WIDTH;
  return {
    width: `${shot.width * k}%`,
    maxWidth: "none",
    marginLeft: `${-shot.frame.x * k}%`,
    marginTop: `${-shot.frame.y * k}%`,
  };
}

export const SHOTS = {
  /** 钱包 + DApp 页面 + 中间的连线，整张 1000 × 716.5（钱包占左边 355）。 */
  defi: { src: `${V}defi-access.webp`, width: 1000, height: 716.5 },
  statue: { src: `${V}statue.webp`, width: 2294, height: 1106 },
} as const;

export type TransferTab = {
  id: "send" | "receive";
  title: string;
  body: string;
  shot: keyof typeof PHONES;
  alt: string;
};

export const TRANSFER_TABS: TransferTab[] = [
  {
    id: "send",
    title: "Send Privately",
    body: "Send tokens in seconds without revealing who sent what to whom.",
    shot: "send",
    alt: "Noir Wallet home on the Shield account, $4,489.21 across privacy providers, with the Send and Receive buttons called out.",
  },
  {
    id: "receive",
    title: "Receive Privately",
    body: "Receive tokens on a shielded address that hides your balance and identity.",
    shot: "receive",
    alt: "Receiving Address screen for ZEC on a NEAR Confidential address: send at least $2 of ZEC. The QR code and the one-time address are blurred.",
  },
];

export const SHIELD_POINTS = [
  "One-click shield tokens",
  "Shield tokens from wallet",
  "Unshield tokens to wallet",
  "Integrate multiple shield providers",
];

/** Supported Shield Tools：前两个已接入，其余即将支持。 */
export const TOOLS: { name: string; icon: string; soon?: boolean }[] = [
  { name: "Zcash Shield", icon: `${F}imgGroup1948762866.svg` },
  { name: "Near Confidential", icon: `${F}imgImage1037.png` },
  { name: "Railgun", icon: `${F}imgGroup1948763189.svg`, soon: true },
  { name: "Privacy Pool", icon: `${F}imgGroup1948763187.svg`, soon: true },
  { name: "ZAMA", icon: `${F}imgGroup1948763186.svg`, soon: true },
];

export const DEFI_LEAVES = ["Lending", "Perps", "Cash Out"];
