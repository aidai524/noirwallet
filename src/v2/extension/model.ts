/**
 * 扩展演示的状态。钱包 → 账号两层，每个账号有自己的头像、三份余额（Shield / Public / Incognito）和记录；
 * 页面栈、浮层、设置、地址簿、已连接的 dApp、锁屏和引导任务是整只钱包共用的。
 */
import {
  type Activity,
  type ActivityKind,
  type Domain,
  type Holdings,
  type NetworkInfo,
  type Place,
  type Pos,
  type Recipient,
  type TokenId,
  AVATAR_ORDER,
  EMPTY_HOLDINGS,
  NETWORKS,
  RECIPIENTS,
  START_ACCOUNTS,
  pos,
} from "./data";

export type Tab = "tokens" | "providers" | "dapps" | "activity";
export type Task = "switch" | "shield" | "send" | "incognito";
export type MoveKind = "shield" | "unshield" | "deposit" | "withdraw";

/** 一笔待提交（或已提交）的演示交易。send 只出不进，其余都是从一个账户挪到另一个账户。 */
export type Tx = {
  kind: ActivityKind;
  from: Domain;
  to: Domain;
  token: TokenId;
  place: Place;
  amount: number;
  toToken: TokenId;
  toPlace: Place;
  toAmount: number;
  fee: string;
  time: string;
  provider: string;
  network: string;
  fromLabel: string;
  toLabel: string;
  route?: "cluster" | "direct";
};

export type Account = {
  id: string;
  wallet: string;
  name: string;
  avatar: number;
  incognito: boolean;
  holdings: Holdings;
  activity: Activity[];
  hidden: boolean;
  networks: { zcash: boolean; evm: boolean };
};

export type SetPage =
  | "general"
  | "security"
  | "password"
  | "indexer"
  | "networks"
  | "network"
  | "addNetwork"
  | "addressBook"
  | "connections"
  | "defaultEvm"
  | "developer"
  | "voting"
  | "help"
  | "about";

export type AcctPage = "details" | "addresses" | "networks" | "seed" | "key";

export type Screen =
  | { id: "send"; domain: Domain; token?: Pos }
  | { id: "receive"; domain: Domain }
  /** pick：先弹出资产列表（照 2.0.0 的 Quick Shield，从卡片「Shield →」进来时先选资产）。 */
  | { id: "move"; kind: MoveKind; token?: Pos; pick?: boolean }
  | { id: "swap"; domain: Domain; token?: Pos }
  | { id: "review"; tx: Tx }
  | { id: "result"; tx: Tx; live: boolean }
  | { id: "token"; token: TokenId }
  | { id: "provider"; place: "near" | "zshield" }
  | { id: "accounts" }
  | { id: "acct"; page: AcctPage; account: string }
  | { id: "settings" }
  | { id: "set"; page: SetPage; arg?: string };

export type Layer = null | "menu" | "accounts" | "incognito";

export type Settings = {
  sidebar: boolean;
  autoLock: string;
  broadcast: boolean;
  analytics: boolean;
  indexer: "auto" | "custom";
  defaultEvm: "ask" | "noir" | "other";
  testnet: boolean;
};

export type Connection = { url: string; as: "Public" | "Incognito" };

export type State = {
  wallets: string[];
  accounts: Account[];
  current: string;
  domain: Domain;
  hidden: boolean;
  tabs: Record<Domain, Tab>;
  stack: Screen[];
  layer: Layer;
  toast: { id: number; text: string } | null;
  done: Task[];
  /** 引导「切换余额」时让卡片闪一下。 */
  hint: number;
  seq: number;
  settings: Settings;
  networks: NetworkInfo[];
  contacts: Recipient[];
  connections: Connection[];
  locked: boolean;
};

/** 组件拿到的视图：在共用状态上摊开当前账号的余额和记录。测试网和主网隔离，测试网下一律是空的。 */
export type View = State & { account: Account; holdings: Holdings; activity: Activity[]; incognito: boolean };

export function viewOf(state: State): View {
  const account = state.accounts.find((item) => item.id === state.current) ?? state.accounts[0];
  const testnet = state.settings.testnet;
  return {
    ...state,
    account,
    holdings: testnet ? EMPTY_HOLDINGS : account.holdings,
    activity: testnet ? [] : account.activity,
    incognito: account.incognito,
  };
}

export type Action =
  | { type: "domain"; domain: Domain }
  | { type: "tab"; tab: Tab }
  | { type: "hide" }
  | { type: "push"; screen: Screen }
  | { type: "replace"; screen: Screen }
  | { type: "back" }
  | { type: "home"; domain?: Domain; tab?: Tab }
  | { type: "layer"; layer: Layer }
  | { type: "incognito" }
  | { type: "commit"; tx: Tx }
  | { type: "receive"; domain: Domain; token: TokenId; place: Place; amount: number; peer: string }
  | { type: "toast"; text: string }
  | { type: "untoast"; id: number }
  | { type: "guide"; task: Task }
  | { type: "reset" }
  // 账号
  | { type: "switch"; account: string }
  | { type: "addAccount"; wallet: string }
  | { type: "addWallet" }
  | { type: "renameAccount"; account: string; name: string }
  | { type: "renameWallet"; wallet: string; name: string }
  | { type: "pinAccount"; account: string }
  | { type: "hideAccount"; account: string; hidden: boolean }
  | { type: "deleteAccount"; account: string }
  | { type: "accountNetworks"; account: string; networks: Account["networks"] }
  // 设置
  | { type: "setting"; patch: Partial<Settings> }
  | { type: "lock" }
  | { type: "unlock" }
  | { type: "addContact"; contact: Recipient }
  | { type: "removeContact"; addr: string }
  | { type: "disconnect"; url: string }
  | { type: "disconnectAll" }
  | { type: "addNetwork"; network: NetworkInfo };

const makeAccount = (id: string, wallet: string, name: string, avatar: number, seed?: Partial<Account>): Account => ({
  id,
  wallet,
  name,
  avatar,
  incognito: false,
  holdings: EMPTY_HOLDINGS,
  activity: [],
  hidden: false,
  networks: { zcash: true, evm: true },
  ...seed,
});

export function initialState(): State {
  return {
    wallets: ["Wallet 1"],
    accounts: START_ACCOUNTS.map((seed, index) =>
      makeAccount(`a${index + 1}`, "Wallet 1", seed.name, seed.avatar, {
        incognito: seed.incognito,
        holdings: seed.holdings,
        activity: seed.activity,
      }),
    ),
    current: "a1",
    domain: "shield",
    hidden: false,
    tabs: { shield: "tokens", public: "tokens", incognito: "tokens" },
    stack: [],
    layer: null,
    toast: null,
    done: [],
    hint: 0,
    seq: 0,
    settings: {
      sidebar: false,
      autoLock: "15 minutes",
      broadcast: true,
      analytics: true,
      indexer: "auto",
      defaultEvm: "ask",
      testnet: false,
    },
    networks: NETWORKS,
    contacts: RECIPIENTS,
    connections: [
      { url: "app.zknoir.com", as: "Public" },
      { url: "app.aave.com", as: "Public" },
    ],
    locked: false,
  };
}

const mark = (done: Task[], task: Task | null) => (task && !done.includes(task) ? [...done, task] : done);

const round = (value: number) => Math.round(value * 1e8) / 1e8;

/** 改当前账号。 */
const updateCurrent = (state: State, change: (account: Account) => Account): State => ({
  ...state,
  accounts: state.accounts.map((account) => (account.id === state.current ? change(account) : account)),
});

const updateAccount = (state: State, id: string, change: (account: Account) => Account): State => ({
  ...state,
  accounts: state.accounts.map((account) => (account.id === id ? change(account) : account)),
});

function apply(holdings: Holdings, tx: Tx): Holdings {
  const next: Holdings = { shield: { ...holdings.shield }, public: { ...holdings.public }, incognito: { ...holdings.incognito } };
  const out = pos(tx.token, tx.place);
  next[tx.from][out] = Math.max(0, round((next[tx.from][out] ?? 0) - tx.amount));
  if (tx.kind !== "send") {
    const into = pos(tx.toToken, tx.toPlace);
    next[tx.to][into] = round((next[tx.to][into] ?? 0) + tx.toAmount);
  }
  return next;
}

function taskOf(tx: Tx): Task | null {
  if (tx.kind === "shield") return "shield";
  if (tx.kind === "send" && tx.from === "shield") return "send";
  return null;
}

/** 切到某个账号：回首页；它没开 Incognito 时不能停在 Incognito 卡上。 */
function switchTo(state: State, id: string): State {
  const target = state.accounts.find((account) => account.id === id);
  if (!target) return state;
  return {
    ...state,
    current: id,
    stack: [],
    layer: null,
    domain: state.domain === "incognito" && !target.incognito ? "public" : state.domain,
  };
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "domain":
      if (action.domain === state.domain) return state;
      return { ...state, domain: action.domain, done: mark(state.done, "switch") };
    case "tab":
      return { ...state, tabs: { ...state.tabs, [state.domain]: action.tab } };
    case "hide":
      return { ...state, hidden: !state.hidden };
    case "push":
      return { ...state, stack: [...state.stack, action.screen], layer: null };
    case "replace":
      return { ...state, stack: [...state.stack.slice(0, -1), action.screen] };
    case "back":
      return { ...state, stack: state.stack.slice(0, -1) };
    case "home":
      return {
        ...state,
        stack: [],
        layer: null,
        domain: action.domain ?? state.domain,
        tabs: action.tab ? { ...state.tabs, [action.domain ?? state.domain]: action.tab } : state.tabs,
      };
    case "layer":
      return { ...state, layer: action.layer };
    case "incognito":
      return {
        ...updateCurrent(state, (account) => ({ ...account, incognito: true })),
        domain: "incognito",
        layer: null,
        done: mark(state.done, "incognito"),
      };
    case "commit": {
      const { tx } = action;
      const entry: Activity = { ...tx, id: `n${state.seq}`, peer: tx.toLabel, when: "Just now", fresh: true };
      return {
        ...updateCurrent(state, (account) => ({
          ...account,
          holdings: apply(account.holdings, tx),
          activity: [entry, ...account.activity],
        })),
        stack: [{ id: "result", tx, live: true }],
        done: mark(state.done, taskOf(tx)),
        seq: state.seq + 1,
      };
    }
    case "receive": {
      // 「模拟一笔入账」：直接记到当前账号上，不跳页面。
      const key = pos(action.token, action.place);
      const entry: Activity = {
        id: `n${state.seq}`,
        kind: "receive",
        from: action.domain,
        to: action.domain,
        token: action.token,
        place: action.place,
        amount: action.amount,
        toToken: action.token,
        toPlace: action.place,
        toAmount: action.amount,
        peer: action.peer,
        when: "Just now",
        fee: "—",
        fresh: true,
      };
      return {
        ...updateCurrent(state, (account) => ({
          ...account,
          holdings: {
            ...account.holdings,
            [action.domain]: {
              ...account.holdings[action.domain],
              [key]: round((account.holdings[action.domain][key] ?? 0) + action.amount),
            },
          },
          activity: [entry, ...account.activity],
        })),
        seq: state.seq + 1,
      };
    }
    case "toast":
      return { ...state, toast: { id: state.seq, text: action.text }, seq: state.seq + 1 };
    case "untoast":
      return state.toast?.id === action.id ? { ...state, toast: null } : state;
    case "guide": {
      const base = { ...state, layer: null as Layer, stack: [] as Screen[], locked: false };
      if (action.task === "switch") return { ...base, hint: state.hint + 1 };
      if (action.task === "shield") return { ...base, domain: "public", stack: [{ id: "move", kind: "shield" }] };
      if (action.task === "send") return { ...base, domain: "shield", stack: [{ id: "send", domain: "shield" }] };
      if (!viewOf(state).incognito) return { ...base, domain: "public", layer: "incognito" };
      return { ...base, domain: "incognito", stack: [{ id: "move", kind: "deposit" }] };
    }
    case "reset":
      return { ...initialState(), seq: state.seq + 1 };

    /* ---------- 账号 ---------- */
    case "switch":
      return switchTo(state, action.account);
    case "addAccount": {
      const count = state.accounts.filter((account) => account.wallet === action.wallet).length;
      const used = new Set(state.accounts.map((account) => account.avatar));
      const avatar = AVATAR_ORDER.find((n) => !used.has(n)) ?? AVATAR_ORDER[state.accounts.length % AVATAR_ORDER.length];
      const id = `a${state.seq}`;
      const added = makeAccount(id, action.wallet, `Account ${count + 1}`, avatar);
      return { ...switchTo({ ...state, accounts: [...state.accounts, added] }, id), seq: state.seq + 1 };
    }
    case "addWallet": {
      const wallet = `Wallet ${state.wallets.length + 1}`;
      const used = new Set(state.accounts.map((account) => account.avatar));
      const avatar = AVATAR_ORDER.find((n) => !used.has(n)) ?? AVATAR_ORDER[0];
      const id = `a${state.seq}`;
      const added = makeAccount(id, wallet, "Account 1", avatar);
      return {
        ...switchTo({ ...state, wallets: [...state.wallets, wallet], accounts: [...state.accounts, added] }, id),
        seq: state.seq + 1,
      };
    }
    case "renameAccount":
      return updateAccount(state, action.account, (account) => ({ ...account, name: action.name }));
    case "renameWallet":
      return {
        ...state,
        wallets: state.wallets.map((wallet) => (wallet === action.wallet ? action.name : wallet)),
        accounts: state.accounts.map((account) => (account.wallet === action.wallet ? { ...account, wallet: action.name } : account)),
      };
    case "pinAccount": {
      const target = state.accounts.find((account) => account.id === action.account);
      if (!target) return state;
      return { ...state, accounts: [target, ...state.accounts.filter((account) => account.id !== action.account)] };
    }
    case "hideAccount": {
      const next = updateAccount(state, action.account, (account) => ({ ...account, hidden: action.hidden }));
      // 藏起当前账号时换到另一个没藏的账号。
      if (action.hidden && action.account === state.current) {
        const other = next.accounts.find((account) => !account.hidden && account.id !== action.account);
        return other ? { ...switchTo(next, other.id), stack: state.stack } : next;
      }
      return next;
    }
    case "deleteAccount": {
      if (state.accounts.length < 2) return state;
      const accounts = state.accounts.filter((account) => account.id !== action.account);
      const wallets = state.wallets.filter((wallet) => accounts.some((account) => account.wallet === wallet));
      const next = { ...state, accounts, wallets };
      return action.account === state.current ? switchTo(next, accounts[0].id) : { ...next, stack: state.stack.slice(0, -1) };
    }
    case "accountNetworks":
      return updateAccount(state, action.account, (account) => ({ ...account, networks: action.networks }));

    /* ---------- 设置 ---------- */
    case "setting":
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case "lock":
      return { ...state, locked: true, stack: [], layer: null };
    case "unlock":
      return { ...state, locked: false };
    case "addContact":
      return { ...state, contacts: [...state.contacts, action.contact] };
    case "removeContact":
      return { ...state, contacts: state.contacts.filter((contact) => contact.addr !== action.addr) };
    case "disconnect":
      return { ...state, connections: state.connections.filter((item) => item.url !== action.url) };
    case "disconnectAll":
      return { ...state, connections: [] };
    case "addNetwork":
      return { ...state, networks: [...state.networks, action.network] };
  }
}
