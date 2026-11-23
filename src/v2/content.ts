/** 新版官网的文案与素材。文案沿用现有官网，钱包里的数字是官网 mock 上的演示值。 */
const F = "/figma/";

export const IMG = {
  logo: `${F}imgNoirLogo1.jpg`,
  avatar: `${F}imgEllipse6107.png`,
  near: `${F}imgImage1059.png`,
  nearLg: `${F}imgImage1037.png`,
  zecCoin: `${F}imgGroup1948762978.svg`,
  zecShielded: `${F}imgGroup1948762865.svg`,
  usdt: `${F}imgImage4.png`,
  usdc: `${F}imgImage3.png`,
  eth: `${F}imgImage1049.png`,
  ethGlyph: `${F}imgGroup1948760748.svg`,
  solGlyph: `${F}imgSolanaSolLogo1.svg`,
  account: `${F}imgGroup1948762998.svg`,
  flip: `${F}imgGroup1948762933.svg`,
  qr: `${F}imgImage1056.png`,
  aave: `${F}imgImage1045.png`,
  hand: `${F}imgGroup1948763157.svg`,
  // 首屏网络/代币统计和新版钱包用到的小图标
  zecChain: `${F}imgGroup1948762160.svg`,
  zecChip: `${F}imgImage1047.png`,
  ethChip: `${F}imgImage902.png`,
  arbChip: `${F}imgGroup1948761781.svg`,
  bnbChip: `${F}imgGroup1948761777.svg`,
  btc: `${F}imgEllipse5698.png`,
  nearChain: `${F}imgGroup1948761782.svg`,
} as const;

/** 新版钱包首页（设计稿：Liam）上的代币行。 */
export const HOME_TOKENS = [
  { sym: "ZEC", icon: IMG.zecCoin, chip: IMG.zecChip, price: "$1,120", change: "-1.57%", value: "$1,220.23", amount: "0.9845" },
  { sym: "USDT", icon: IMG.usdt, chip: IMG.ethChip, price: "$0.99", value: "$2,401.21", amount: "2,401.24", hl: true },
  { sym: "USDC", icon: IMG.usdc, chip: IMG.ethChip, price: "$0.99", value: "$2,400.02", amount: "2,400.05" },
  { sym: "ETH", icon: IMG.eth, chip: IMG.ethChip, price: "$2,238.96", change: "-4.68%", value: "$1,220.23", amount: "0.5450" },
];

/** Liam 的公开地址（沿用官网 mock 上的演示地址）。 */
export const PUBLIC_ADDRESS = "0x1769…457A8f4";

/** Shield 视图里的隐私服务商（设计稿：两个已接入、两个即将支持，合计 $4,489.21）。 */
export const PROVIDERS: { name: string; icon: string; tone: string; balance?: string; coins?: string[] }[] = [
  {
    name: "NEAR Confidential",
    icon: IMG.nearLg,
    tone: "near",
    balance: "$3,058.02",
    coins: [IMG.zecCoin, IMG.usdt, IMG.usdc, IMG.eth],
  },
  { name: "Zcash shield", icon: `${F}imgGroup1948762866.svg`, tone: "zcash", balance: "$1,431.19", coins: [IMG.zecCoin] },
  { name: "ZAMA", icon: `${F}imgGroup1948763186.svg`, tone: "zama" },
  { name: "Privacy Pools", icon: `${F}imgGroup1948763187.svg`, tone: "pools" },
];

export const DAPPS = [
  { name: "Noir Lending", url: "app.zknoir.com/lending", icon: IMG.logo },
  { name: "Noir Perp", url: "app.zknoir.com/perps", icon: IMG.logo },
  { name: "Aave Lending", url: "app.aave.com", icon: IMG.aave },
];

export type Scene = "send" | "receive" | "move" | "defi";

export const STAGES: { scene: Scene; title: string; body: string }[] = [
  {
    scene: "send",
    title: "Send privately",
    body: "Send from your Shield balance, not your public address. Provider, fee and time are shown before you sign.",
  },
  {
    scene: "receive",
    title: "Receive privately",
    body: "Ask to receive ZEC on a Zcash shielded address. It lands in your Shield balance.",
  },
  {
    scene: "move",
    title: "Move privately",
    body: "Deposit from Public into Shield. Cluster uses multiple transactions for stronger privacy; Directly is one faster transaction.",
  },
  {
    scene: "defi",
    title: "Private DeFi access",
    body: "Switch to your Incognito account in one tap and use dApps: lending, perps, cash out.",
  },
];

/** Supported Shield Tools：前两个已接入，其余即将支持。 */
export const TOOLS: { name: string; icon: string; soon?: boolean }[] = [
  { name: "Zcash Shield", icon: `${F}imgGroup1948762866.svg` },
  { name: "NEAR Confidential", icon: IMG.nearLg },
  { name: "Railgun", icon: `${F}imgGroup1948763189.svg`, soon: true },
  { name: "Privacy Pool", icon: `${F}imgGroup1948763187.svg`, soon: true },
  { name: "ZAMA", icon: `${F}imgGroup1948763186.svg`, soon: true },
];
