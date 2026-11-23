/** 演示钱包（新版界面）的状态。右侧四步和钱包画面共用这一份状态。 */
import type { Scene } from "./content";
import type { HomeAccount, HomeMode, HomeTab } from "./WalletHome";

export type Screen = "home" | "send" | "receive" | "move" | "moving";

export type WalletState = {
  screen: Screen;
  /** 首页显示 Wallet 视图还是 Shield 视图。 */
  mode: HomeMode;
  /** Wallet 视图叠在前面的卡，也就是当前账户。 */
  front: HomeAccount;
  tab: HomeTab;
  /** Send 从哪边出钱。 */
  from: "public" | "shield";
  /** 资金方向：in = Deposit（Public → Shield），out = Withdraw（Shield → Public）。 */
  dir: "in" | "out";
  route: "cluster" | "direct";
  /** 转移之后的进度，0–3。 */
  step: number;
  sent: "idle" | "busy" | "done";
  /** 演示用的手指正停在哪里。 */
  hand: "" | "from" | "card";
  /** 每次切场景加一，让进场动画重播。 */
  key: number;
};

export type WalletAction =
  | { type: "scene"; scene: Scene }
  | { type: "go"; screen: Screen; dir?: WalletState["dir"] }
  | { type: "mode"; mode: HomeMode }
  | { type: "front"; front: HomeAccount; auto?: boolean }
  | { type: "tab"; tab: HomeTab }
  | { type: "from"; from: WalletState["from"]; auto?: boolean }
  | { type: "flip" }
  | { type: "route"; route: WalletState["route"] }
  | { type: "step" }
  | { type: "sent"; sent: WalletState["sent"] }
  | { type: "hand"; hand: WalletState["hand"] };

export const INITIAL_WALLET: WalletState = {
  screen: "home",
  mode: "wallet",
  front: "incognito",
  tab: "tokens",
  from: "shield",
  dir: "in",
  route: "cluster",
  step: 0,
  sent: "idle",
  hand: "",
  key: 0,
};

export function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case "scene": {
      const base: WalletState = { ...state, step: 0, sent: "idle", key: state.key + 1 };
      if (action.scene === "send") return { ...base, mode: "shield", screen: "send", from: "public", hand: "from" };
      if (action.scene === "receive") return { ...base, mode: "shield", screen: "receive", hand: "" };
      if (action.scene === "move")
        return { ...base, mode: "wallet", screen: "move", dir: "in", route: "cluster", hand: "" };
      return { ...base, mode: "wallet", screen: "home", front: "public", tab: "dapps", hand: "card" };
    }
    case "go":
      return {
        ...state,
        screen: action.screen,
        dir: action.dir ?? state.dir,
        step: 0,
        sent: "idle",
        hand: "",
        key: state.key + 1,
      };
    case "mode":
      return { ...state, mode: action.mode };
    case "front":
      return { ...state, front: action.front, hand: action.auto ? state.hand : "" };
    case "tab":
      return { ...state, tab: action.tab };
    case "from":
      return { ...state, from: action.from, hand: action.auto ? state.hand : "" };
    case "flip":
      return { ...state, dir: state.dir === "in" ? "out" : "in" };
    case "route":
      return { ...state, route: action.route };
    case "step":
      return { ...state, step: Math.min(3, state.step + 1) };
    case "sent":
      return { ...state, sent: action.sent };
    case "hand":
      return { ...state, hand: action.hand };
  }
}

/** 钱包当前画面对应右侧第几步，-1 表示不对应任何一步。 */
export function stageOf(state: WalletState) {
  if (state.screen === "send") return 0;
  if (state.screen === "receive") return 1;
  if (state.screen === "move" || state.screen === "moving") return state.dir === "in" ? 2 : -1;
  if (state.mode === "wallet" && (state.hand === "card" || (state.front === "incognito" && state.tab === "dapps"))) return 3;
  return -1;
}
