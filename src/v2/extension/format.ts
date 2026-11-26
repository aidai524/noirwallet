/** 演示钱包里共用的格式化和换算。放在组件文件外面，热更新才不会整页刷新。 */
import type { KeyboardEvent } from "react";
import { type Activity, type Domain, PLACES, amountText, usd } from "./data";
import type { Tx } from "./model";

/** 给页内的小下拉用：Esc 只关掉它自己，不会退页或关掉整个演示。 */
export const closeOnEscape = (open: boolean, close: () => void) => (event: KeyboardEvent) => {
  if (!open || event.key !== "Escape") return;
  event.preventDefault();
  event.stopPropagation();
  close();
};

export const MASK = "••••";

export const DOMAIN_LABEL: Record<Domain, string> = { shield: "Shield", public: "Public", incognito: "Incognito" };

export const money = (value: number, hidden: boolean) => (hidden ? `$${MASK}` : usd(value));

/** 记录里显示的金额：从这个账户出去记负，进来记正。 */
export function activityLine(item: Activity, domain: Domain) {
  const outgoing = item.kind === "send" || (item.from === domain && item.to !== domain);
  if (item.kind === "swap") return `+${amountText(item.toAmount, item.toToken)}`;
  return `${outgoing ? "−" : "+"}${amountText(outgoing ? item.amount : item.toAmount, outgoing ? item.token : item.toToken)}`;
}

/** 把一条记录还原成交易详情页要的样子。 */
export function toTx(item: Activity): Tx {
  return {
    kind: item.kind,
    from: item.from,
    to: item.to,
    token: item.token,
    place: item.place,
    amount: item.amount,
    toToken: item.toToken,
    toPlace: item.toPlace,
    toAmount: item.toAmount,
    fee: item.fee,
    time: item.time ?? "—",
    provider: item.provider ?? (PLACES[item.toPlace].provider ? PLACES[item.toPlace].name : PLACES[item.place].name),
    network: item.network ?? PLACES[item.place].name,
    fromLabel: item.fromLabel ?? (item.kind === "receive" ? item.peer : `Account 1 · ${DOMAIN_LABEL[item.from]}`),
    toLabel: item.toLabel ?? (item.kind === "send" ? item.peer : `Account 1 · ${DOMAIN_LABEL[item.to]}`),
    route: item.route,
  };
}

/** 金额输入只留数字和一个小数点。 */
export function cleanAmount(raw: string) {
  const digits = raw.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const [whole, ...rest] = digits.split(".");
  const joined = rest.length ? `${whole || "0"}.${rest.join("").slice(0, 8)}` : whole;
  return joined.replace(/^0+(?=\d)/, "");
}

export const trimNumber = (value: number, digits: number) => value.toFixed(digits).replace(/\.?0+$/, "") || "0";

/** 装饰用二维码的点阵：有三个定位角的位置空出来，其余随机，扫不出东西。 */
export function qrCells(seed: string, n = 25) {
  let state = [...seed].reduce((acc, char) => (acc * 33 + char.charCodeAt(0)) >>> 0, 5381);
  const out: [number, number][] = [];
  const finder = (x: number, y: number) => (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      state = (state * 1103515245 + 12345) >>> 0;
      if (!finder(x, y) && state / 2 ** 32 > 0.52) out.push([x, y]);
    }
  }
  return out;
}
