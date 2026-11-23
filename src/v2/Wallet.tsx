/**
 * 浏览器里模拟的 Noir Wallet（新版界面：Liam · Wallet / Shield）。
 * 首页和首屏是同一个组件。Shield 视图里的 Send / Receive、Wallet 视图里的 Deposit / Withdraw，
 * 字段都沿用官网上的产品界面。每一屏有一个讲隐私的小动作：Send 从 Public 切到 Shield、
 * Receive 地址解码出现、Deposit 走 Cluster 多笔交易、DeFi 换成 Incognito 账户再连 dApp。
 */
import { useEffect, type CSSProperties, type Dispatch } from "react";
import { IMG, PUBLIC_ADDRESS } from "./content";
import { Icon } from "./Icon";
import { prefersReducedMotion } from "./motion";
import { Scramble } from "./Scramble";
import { WalletHome } from "./WalletHome";
import type { WalletAction, WalletState } from "./walletModel";

type ScreenProps = {
  state: WalletState;
  dispatch: Dispatch<WalletAction>;
};

const ROUTES = {
  cluster: { name: "Cluster", sub: "Multiple transactions", privacy: "Strong", time: "~10 mins", fee: "~$1.25" },
  direct: { name: "Directly", sub: "One transaction", privacy: "Standard", time: "~1 min", fee: "~$0.35" },
} as const;

/** Cluster 的几条通道：每条一个点，错开出发。 */
const LANES = [
  { top: 4, delay: "0s", time: "2.2s" },
  { top: 13, delay: "0.7s", time: "2.6s" },
  { top: 22, delay: "0.3s", time: "2s" },
  { top: 31, delay: "1.1s", time: "2.4s" },
];

function useDemoTimers({ hand, key, screen, sent }: WalletState, dispatch: Dispatch<WalletAction>) {
  // 演示手指：先停在目标上，按下去，再淡出。清掉手指放在最后，避免提前取消别的计时器。
  useEffect(() => {
    if (!hand) return;
    const reduced = prefersReducedMotion();
    const timers: number[] = [];
    const at = (ms: number, run: () => void) => timers.push(window.setTimeout(run, reduced ? 0 : ms));
    if (hand === "from") at(1000, () => dispatch({ type: "from", from: "shield", auto: true }));
    else at(1000, () => dispatch({ type: "front", front: "incognito", auto: true }));
    at(1800, () => dispatch({ type: "hand", hand: "" }));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [hand, key, dispatch]);

  useEffect(() => {
    if (screen !== "moving") return;
    const delays = prefersReducedMotion() ? [0, 0, 0] : [700, 2300, 3500];
    const timers = delays.map((ms) => window.setTimeout(() => dispatch({ type: "step" }), ms));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [screen, key, dispatch]);

  useEffect(() => {
    if (sent === "idle") return;
    const id =
      sent === "busy"
        ? window.setTimeout(() => dispatch({ type: "sent", sent: "done" }), 900)
        : window.setTimeout(() => dispatch({ type: "go", screen: "home" }), 1300);
    return () => window.clearTimeout(id);
  }, [sent, dispatch]);
}

function Hand() {
  return (
    <span className="nw-hand" aria-hidden="true">
      <img src={IMG.hand} alt="" />
    </span>
  );
}

function Bar({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <div className="nw-bar">
      {onBack ? (
        <button type="button" className="nw-iconbtn" onClick={onBack} aria-label="Back">
          <Icon name="back" />
        </button>
      ) : (
        <span className="nw-bar-sp" />
      )}
      <h3>{title}</h3>
      <span className="nw-bar-sp" />
    </div>
  );
}

function Track({ done = false }: { done?: boolean }) {
  return (
    <div className={`nw-track${done ? " is-done" : ""}`} aria-hidden="true">
      {[0, 1, 2, 3, 4, 5, 6].map((k) => (
        <i key={k} style={{ "--k": k } as CSSProperties} />
      ))}
    </div>
  );
}

function Home({ state, dispatch }: ScreenProps) {
  return (
    <div className="nw-scr nw-anim">
      <div className="nw-scroll">
        <WalletHome
          mode={state.mode}
          onMode={(mode) => dispatch({ type: "mode", mode })}
          front={state.front}
          onFront={(front) => dispatch({ type: "front", front })}
          tab={state.tab}
          onTab={(tab) => dispatch({ type: "tab", tab })}
          onDeposit={() => dispatch({ type: "go", screen: "move", dir: "in" })}
          onWithdraw={() => dispatch({ type: "go", screen: "move", dir: "out" })}
          onSend={() => dispatch({ type: "go", screen: "send" })}
          onReceive={() => dispatch({ type: "go", screen: "receive" })}
          hand={state.hand === "card"}
        />
      </div>
    </div>
  );
}

function Send({ state, dispatch }: ScreenProps) {
  const shield = state.from === "shield";
  const label = state.sent === "idle" ? "Send" : state.sent === "busy" ? "Sending…" : "Sent";
  return (
    <div className="nw-scr nw-anim">
      <Bar title="Send" onBack={() => dispatch({ type: "go", screen: "home" })} />
      <div className="nw-scroll nw-pad">
        <div className="nw-row">
          <span className="nw-lbl">Send from</span>
          <div className="nw-pills" role="group" aria-label="Send from">
            <button
              type="button"
              className={shield ? "" : "on"}
              aria-pressed={!shield}
              onClick={() => dispatch({ type: "from", from: "public" })}
            >
              Public
            </button>
            <button
              type="button"
              className={`is-shield${shield ? " on" : ""}`}
              aria-pressed={shield}
              onClick={() => dispatch({ type: "from", from: "shield" })}
            >
              Shield
            </button>
            {state.hand === "from" && <Hand />}
          </div>
        </div>
        <p className={`nw-privacy ${shield ? "is-ok" : "is-warn"}`} aria-live="polite">
          <Icon name={shield ? "lock" : "eye"} />
          {shield ? (
            <span>Sent from your Shield balance, not from Liam’s public address.</span>
          ) : (
            <span>Sent from your public address. It links back to you.</span>
          )}
        </p>

        <div className="nw-row">
          <span className="nw-lbl">Send to</span>
          <span className="nw-net">
            <i>
              <img src={IMG.ethGlyph} alt="" />
            </i>
            Ethereum
            <Icon name="chev" />
          </span>
        </div>
        <div className="nw-field">
          <b>0x5413…258dc1</b>
          <Icon name="book" />
        </div>

        <div className="nw-row">
          <span className="nw-lbl">Amount</span>
          <span className="nw-meta">
            Bal. 123.35 <span className="nw-max">Max</span>
          </span>
        </div>
        <div className="nw-field">
          <b>123.35</b>
          <span className="nw-asset">
            <img src={IMG.usdt} alt="" />
            USDT
            <Icon name="chev" />
          </span>
        </div>

        <dl className="nw-kv">
          <dt>Provider</dt>
          <dd>
            <img src={IMG.near} alt="" />
            Confidential
          </dd>
          <dt>Slippage</dt>
          <dd>0.5%</dd>
          <dt>Fee</dt>
          <dd>
            $0.25 <span className="m">Standard</span>
          </dd>
          <dt>Est. time</dt>
          <dd>~17s</dd>
        </dl>
      </div>
      <div className="nw-foot">
        <button
          type="button"
          className="nw-btn nw-btn-lg"
          disabled={state.sent !== "idle"}
          onClick={() => dispatch({ type: "sent", sent: "busy" })}
        >
          {state.sent === "busy" && <span className="nw-spin" aria-hidden="true" />}
          {state.sent === "done" && <Icon name="check" />}
          {label}
        </button>
      </div>
    </div>
  );
}

/** Receive：收款地址（原官网的 Receiving Address 页），收进 Shield。 */
function Receive({ dispatch }: ScreenProps) {
  return (
    <div className="nw-scr nw-anim">
      <Bar title="Receive" onBack={() => dispatch({ type: "go", screen: "home" })} />
      <div className="nw-scroll nw-pad nw-center">
        <div className="nw-flow">
          <img className="r" src={IMG.zecCoin} alt="" />
          <Track />
          <img src={IMG.zecShielded} alt="" />
        </div>
        <p className="nw-flow-cap">
          Asking to receive
          <br />
          <b>ZEC on Zcash shielded address</b>
        </p>
        <p className="nw-min">Send at least $2 of ZEC</p>
        <div className="nw-qr">
          <img src={IMG.qr} alt="" />
        </div>
        <p className="nw-label">Receive address</p>
        <div className="nw-field">
          <b>
            <Scramble text="0x913Fa75…66ae970fE" intro />
          </b>
          <span className="nw-copy">Copy</span>
        </div>
        <p className="nw-label">Refund address</p>
        <div className="nw-addr">
          <img src={IMG.avatar} alt="" />
          <div>
            <b>
              Liam <i className="nw-tag is-priv">Incognito</i>
            </b>
            <small>0x913…970fE</small>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Deposit（Public → Shield）和 Withdraw（Shield → Public）共用一页，中间的切换按钮翻转方向。 */
function Move({ state, dispatch }: ScreenProps) {
  const cluster = state.route === "cluster";
  const deposit = state.dir === "in";
  const publicLeg = (
    <div className="nw-leg">
      <img src={IMG.account} alt="" />
      <div>
        <small>
          {deposit ? "From" : "To"} Liam <i className="nw-tag">Public</i>
        </small>
        <b>{PUBLIC_ADDRESS}</b>
      </div>
      <Icon name="chev" />
    </div>
  );
  const shieldLeg = (
    <div className="nw-leg">
      <img src={IMG.near} alt="" />
      <div>
        <small>
          {deposit ? "To" : "From"} <i className="nw-tag is-shield">Shield</i>
        </small>
        <b>Near Confidential Intents</b>
      </div>
      <Icon name="chev" />
    </div>
  );
  return (
    <div className="nw-scr nw-anim">
      <Bar title={deposit ? "Deposit" : "Withdraw"} onBack={() => dispatch({ type: "go", screen: "home" })} />
      <div className="nw-scroll">
        <div className="nw-amt">
          <b className="nw-amt-v">500</b>
          <span className="nw-asset">
            <img src={IMG.usdt} alt="" />
            USDT
            <Icon name="chev" />
          </span>
          <div className="nw-amt-meta">
            <span>Balance {deposit ? "1,023.35" : "3,058.02"}</span>
            <span className="nw-max">Max</span>
          </div>
        </div>

        <div className="nw-legs">
          {deposit ? publicLeg : shieldLeg}
          <button
            type="button"
            className="nw-legs-sw"
            onClick={() => dispatch({ type: "flip" })}
            aria-label={deposit ? "Switch to Withdraw" : "Switch to Deposit"}
          >
            <img src={IMG.flip} alt="" />
          </button>
          {deposit ? shieldLeg : publicLeg}
        </div>

        <div className="nw-routes">
          {(Object.keys(ROUTES) as (keyof typeof ROUTES)[]).map((id) => {
            const route = ROUTES[id];
            const on = state.route === id;
            return (
              <button
                type="button"
                key={id}
                className={`nw-route${on ? " on" : ""}`}
                aria-pressed={on}
                onClick={() => dispatch({ type: "route", route: id })}
              >
                <b>
                  {route.name}
                  {id === "cluster" && <i>Recommended</i>}
                </b>
                <span>{route.sub}</span>
                <dl>
                  <dt>Privacy</dt>
                  <dd>{route.privacy}</dd>
                  <dt>Time</dt>
                  <dd>{route.time}</dd>
                  <dt>Fee</dt>
                  <dd>{route.fee}</dd>
                </dl>
              </button>
            );
          })}
        </div>

        <div className={`nw-split ${cluster ? "is-cluster" : "is-direct"}${deposit ? "" : " is-out"}`} aria-hidden="true">
          <img src={deposit ? IMG.usdt : IMG.near} alt="" />
          <span className="nw-lanes">
            {(cluster ? LANES : [{ top: 17, delay: "0s", time: "1.6s" }]).map((lane) => (
              <i key={`${state.route}-${lane.top}`} style={{ top: lane.top, "--d": lane.delay, "--t": lane.time } as CSSProperties} />
            ))}
          </span>
          <img src={deposit ? IMG.near : IMG.usdt} alt="" />
        </div>
      </div>
      <div className="nw-foot">
        <button type="button" className="nw-btn nw-btn-lg" onClick={() => dispatch({ type: "go", screen: "moving" })}>
          {deposit ? "Deposit" : "Withdraw"}
        </button>
      </div>
    </div>
  );
}

function Moving({ state, dispatch }: ScreenProps) {
  const route = ROUTES[state.route];
  const done = state.step >= 3;
  const deposit = state.dir === "in";
  const steps = [
    ["Signed", "In Noir Wallet"],
    ["Moving privately", `${route.name} · ${route.sub.toLowerCase()}`],
    deposit ? ["In Shield", "Near Confidential Intents"] : ["In Public", "Liam’s public address"],
  ];
  const title = deposit
    ? done
      ? "Deposited to Shield"
      : "Depositing to Shield"
    : done
      ? "Withdrawn to Public"
      : "Withdrawing to Public";
  return (
    <div className="nw-scr nw-anim">
      <Bar title={title} />
      <div className="nw-scroll nw-pad">
        <div className="nw-flow">
          <img className="r" src={deposit ? IMG.usdt : IMG.near} alt="" />
          <Track done={done} />
          <img src={deposit ? IMG.near : IMG.usdt} alt="" />
        </div>
        <p className="nw-flow-cap nw-center">
          <b>500.00 USDT</b> {deposit ? "from Public to Shield" : "from Shield to Public"}
        </p>
        <ol className="nw-steps">
          {steps.map(([title, detail], index) => {
            const status = index < state.step ? "done" : index === state.step ? "now" : "todo";
            return (
              <li key={title} className={status}>
                <span className="k">{status === "done" && <Icon name="check" />}</span>
                <div>
                  <b>{title}</b>
                  <small>{detail}</small>
                </div>
              </li>
            );
          })}
        </ol>
        {done && (
          <p className="nw-note">
            <Icon name="lock" />
            {deposit ? "500 USDT is now in your Shield balance." : "500 USDT is back in Liam’s public balance."}
          </p>
        )}
      </div>
      <div className="nw-foot">
        {done ? (
          <button type="button" className="nw-btn nw-btn-lg" onClick={() => dispatch({ type: "go", screen: "home" })}>
            Done
          </button>
        ) : (
          <button type="button" className="nw-btn-ghost" onClick={() => dispatch({ type: "go", screen: "home" })}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}

type WalletProps = ScreenProps & {
  /** 用户自己点了钱包，右侧导览就停下。 */
  onTouch: () => void;
};

export function Wallet({ state, dispatch, onTouch }: WalletProps) {
  useDemoTimers(state, dispatch);
  return (
    <div
      className="nw"
      role="group"
      aria-label="Noir Wallet, simulated"
      onPointerDownCapture={onTouch}
      onKeyDownCapture={onTouch}
    >
      {state.screen === "home" && <Home key={state.key} state={state} dispatch={dispatch} />}
      {state.screen === "send" && <Send key={state.key} state={state} dispatch={dispatch} />}
      {state.screen === "receive" && <Receive key={state.key} state={state} dispatch={dispatch} />}
      {state.screen === "move" && <Move key={state.key} state={state} dispatch={dispatch} />}
      {state.screen === "moving" && <Moving key={state.key} state={state} dispatch={dispatch} />}
    </div>
  );
}
