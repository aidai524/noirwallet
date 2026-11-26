/** 演示钱包本体：一个扩展弹窗（侧边栏模式时更高）。首页常驻，流程页一层层叠上去，返回时保留填过的内容。 */
import { useEffect, useRef, type Dispatch, type KeyboardEvent } from "react";
import { AccountScreen, AccountsPage } from "./accounts";
import { MoveFlow, ProviderDetail, ReceiveFlow, ResultScreen, ReviewScreen, SendFlow, SwapFlow, TokenDetail } from "./flows";
import { Home } from "./home";
import { type Action, type Screen, type State, type View, viewOf } from "./model";
import { LockScreen, SettingScreen, SettingsPage } from "./settings";

type Props = { state: View; dispatch: Dispatch<Action> };

// 每个页面对象一个稳定的 key：同一层被替换成新页面时要重新挂载。
const ids = new WeakMap<Screen, number>();
let nextId = 0;
const keyOf = (screen: Screen) => {
  if (!ids.has(screen)) ids.set(screen, (nextId += 1));
  return ids.get(screen);
};

function ScreenView({ screen, state, dispatch }: Props & { screen: Screen }) {
  switch (screen.id) {
    case "send":
      return <SendFlow state={state} dispatch={dispatch} start={screen.domain} token={screen.token} />;
    case "receive":
      return <ReceiveFlow state={state} dispatch={dispatch} start={screen.domain} />;
    case "move":
      return <MoveFlow state={state} dispatch={dispatch} kind={screen.kind} token={screen.token} pick={screen.pick} />;
    case "swap":
      return <SwapFlow state={state} dispatch={dispatch} start={screen.domain} token={screen.token} />;
    case "review":
      return <ReviewScreen state={state} dispatch={dispatch} tx={screen.tx} />;
    case "result":
      return <ResultScreen state={state} dispatch={dispatch} tx={screen.tx} live={screen.live} />;
    case "token":
      return <TokenDetail state={state} dispatch={dispatch} token={screen.token} />;
    case "provider":
      return <ProviderDetail state={state} dispatch={dispatch} place={screen.place} />;
    case "accounts":
      return <AccountsPage state={state} dispatch={dispatch} />;
    case "acct":
      return <AccountScreen state={state} dispatch={dispatch} page={screen.page} id={screen.account} />;
    case "settings":
      return <SettingsPage state={state} dispatch={dispatch} />;
    case "set":
      return <SettingScreen state={state} dispatch={dispatch} page={screen.page} arg={screen.arg} />;
  }
}

export function DemoWallet({ state: raw, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const state = viewOf(raw);
  const { stack, toast, locked } = state;
  const testnet = state.settings.testnet;
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => dispatch({ type: "untoast", id: toast.id }), 2600);
    return () => window.clearTimeout(timer);
  }, [toast, dispatch]);

  // 换页后下面那层会变成 inert，焦点会掉到 body 上。这时把焦点交给最上面那层，
  // 键盘用户还在钱包里，Esc / Tab 也照常工作。焦点在左侧引导里时不去抢。
  useEffect(() => {
    const node = root.current;
    if (!node || locked) return;
    const active = document.activeElement;
    const lost = !active || active === document.body || (node.contains(active) && active.closest("[inert]") !== null);
    if (!lost) return;
    const top = node.querySelector<HTMLElement>(".xd-layer.is-top") ?? node.querySelector<HTMLElement>(".xd-base");
    top?.focus({ preventScroll: true });
  }, [stack.length, locked]);

  // Esc 先关钱包里的浮层、再退一页；都没有时才交给外层关掉整个演示。锁屏时不处理。
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || locked) return;
    if (state.layer) dispatch({ type: "layer", layer: null });
    else if (stack.length) dispatch({ type: "back" });
    else return;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div ref={root} className="xd" data-testnet={testnet || undefined} onKeyDown={onKeyDown}>
      {testnet && <div className="xd-testnet">TESTNET</div>}
      <div className="xd-base" inert={stack.length > 0 || locked} tabIndex={-1}>
        <Home state={state} dispatch={dispatch} />
      </div>
      {stack.map((screen, index) => {
        const top = index === stack.length - 1;
        return (
          <div key={keyOf(screen)} className={`xd-layer${top ? " is-top" : ""}`} inert={!top || locked} tabIndex={-1}>
            <ScreenView screen={screen} state={state} dispatch={dispatch} />
          </div>
        );
      })}
      {locked && <LockScreen dispatch={dispatch} />}
      {toast && (
        <div className="xd-toast" role="status" key={toast.id}>
          {toast.text}
        </div>
      )}
    </div>
  );
}
