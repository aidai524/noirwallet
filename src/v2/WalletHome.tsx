/**
 * 新版钱包首页，首屏和 Private Transfers 演示共用。
 * Wallet 视图：Liam · Public + Incognito · Deposit / Withdraw / Swap（设计稿一）。
 * Shield 视图：Shield balance · 隐私服务商 · Send / Receive / Swap（设计稿二）。
 * 首屏只开放 Wallet / Shield 开关；演示里卡片、操作和标签都能点。
 */
import type { CSSProperties } from "react";
import { DAPPS, HOME_TOKENS, IMG, PROVIDERS, PUBLIC_ADDRESS } from "./content";
import { PROVIDER_GLYPHS } from "./glyphs";
import { Icon, type IconName } from "./Icon";
import { Scramble } from "./Scramble";

export type HomeMode = "wallet" | "shield";
export type HomeAccount = "public" | "incognito";
export type HomeTab = "tokens" | "dapps";

/** Incognito 卡右上角的帽子和眼镜。 */
function IncognitoMark() {
  return (
    <svg className="hw-incog-mark" viewBox="0 0 48 40" aria-hidden="true">
      <path
        d="M11 17h26l-2.6-10.4c-.5-2-2.6-3-4.5-2.2l-4.2 1.8a4 4 0 0 1-3.2 0l-4.2-1.8c-1.9-.8-4 .2-4.5 2.2Z"
        fill="currentColor"
      />
      <path d="M5 20.5h38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="15" cy="30.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="33" cy="30.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M20.5 30.5h7" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

/** 操作块：传了点击回调就是按钮，否则只是展示。 */
function action(icon: IconName, text: string, run?: () => void) {
  return run ? (
    <button type="button" onClick={run}>
      <Icon name={icon} />
      {text}
    </button>
  ) : (
    <span>
      <Icon name={icon} />
      {text}
    </span>
  );
}

type WalletViewProps = {
  front: HomeAccount;
  onFront?: (account: HomeAccount) => void;
  tab: HomeTab;
  onTab?: (tab: HomeTab) => void;
  onDeposit?: () => void;
  onWithdraw?: () => void;
  hand: boolean;
};

function WalletView({ front, onFront, tab, onTab, onDeposit, onWithdraw, hand }: WalletViewProps) {
  const interactive = Boolean(onFront || onTab || onDeposit || onWithdraw);

  const card = (account: HomeAccount) => {
    const incog = account === "incognito";
    const className = `hw-card ${incog ? "hw-incog" : "hw-public"} ${front === account ? "is-front" : "is-back"}`;
    const body = (
      <>
        <span className="hw-label">
          <i />
          {incog ? "Incognito" : "Public"}
        </span>
        <b>{incog ? "$1,232.06" : "$1,406.57"}</b>
        {incog && <IncognitoMark />}
      </>
    );
    return onFront ? (
      <button type="button" className={className} aria-pressed={front === account} onClick={() => onFront(account)}>
        {body}
      </button>
    ) : (
      <div className={className}>{body}</div>
    );
  };

  const tabButton = (id: HomeTab, text: string) =>
    onTab ? (
      <button type="button" className={tab === id ? "on" : ""} aria-pressed={tab === id} onClick={() => onTab(id)}>
        {text}
      </button>
    ) : (
      <span className={tab === id ? "on" : ""}>{text}</span>
    );

  return (
    <div className="hw-view">
      <p className="hw-total">Total $2,638.63</p>

      <div className="hw-cards">
        {card("public")}
        {card("incognito")}
        {hand && (
          <span className="nw-hand hw-hand" aria-hidden="true">
            <img src={IMG.hand} alt="" />
          </span>
        )}
      </div>

      <div className="hw-body" aria-hidden={interactive ? undefined : true}>
        <div className="hw-acts">
          {action("deposit", "Deposit", onDeposit)}
          {action("withdraw", "Withdraw", onWithdraw)}
          {action("swap", "Swap")}
        </div>
        <div className="hw-tabs">
          {tabButton("tokens", "Tokens")}
          {tabButton("dapps", "DApps")}
          <span>Activity</span>
        </div>

        {tab === "tokens" ? (
          <>
            <div className="hw-filter" aria-hidden="true">
              <span className="hw-net">
                All networks
                <Icon name="chev" />
              </span>
              <span className="hw-views">
                <i className="on">
                  <Icon name="stack" />
                </i>
                <i>
                  <Icon name="list" />
                </i>
              </span>
              <span className="hw-more">···</span>
            </div>
            {HOME_TOKENS.map((token) => (
              <div className={`hw-tok${token.hl ? " hl" : ""}`} key={token.sym}>
                <span className="hw-coin">
                  <img src={token.icon} alt="" />
                  <i>
                    <img src={token.chip} alt="" />
                  </i>
                </span>
                <span className="hw-tok-n">
                  <b>{token.sym}</b>
                  <span>
                    {token.price}
                    {token.change && <em>{token.change}</em>}
                  </span>
                </span>
                <span className="hw-tok-v">
                  <b>{token.value}</b>
                  <span>{token.amount}</span>
                </span>
              </div>
            ))}
          </>
        ) : (
          // 换账户时整块重新进场，让人看到“连接身份”变了。
          <div className="hw-dapps" key={front}>
            <p className="hw-as">
              Connected as <b>{front === "incognito" ? "Incognito" : PUBLIC_ADDRESS}</b>
              <i className={`hw-tag${front === "incognito" ? " is-incog" : ""}`}>
                {front === "incognito" ? "Private" : "Public"}
              </i>
            </p>
            {DAPPS.map((dapp, k) => (
              <div className="hw-dapp" key={dapp.name} style={{ "--k": k } as CSSProperties}>
                <img src={dapp.icon} alt="" />
                <span>
                  <b>{dapp.name}</b>
                  <small>{dapp.url}</small>
                </span>
                <em>Open</em>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type ShieldViewProps = {
  onSend?: () => void;
  onReceive?: () => void;
};

/** 设计稿二：Shield balance 是各隐私服务商余额之和。进场时数字从乱码解开。 */
function ShieldView({ onSend, onReceive }: ShieldViewProps) {
  const interactive = Boolean(onSend || onReceive);
  return (
    <div className="hw-view hs">
      <div className="hs-bal">
        <b>
          <Scramble text="$4,489.21" intro />
        </b>
        <span>Shield balance</span>
      </div>
      <div className="hs-glyphs" aria-hidden="true">
        {PROVIDER_GLYPHS.map((glyph) => (
          <svg key={glyph.name} viewBox={glyph.viewBox}>
            <path d={glyph.d} fill="currentColor" fillRule={glyph.evenodd ? "evenodd" : undefined} />
          </svg>
        ))}
      </div>
      <p className="hs-note">Your combined balance across privacy providers.</p>

      <div className="hs-body" aria-hidden={interactive ? undefined : true}>
        <div className="hw-acts hs-acts">
          {action("send", "Send", onSend)}
          {action("receive", "Receive", onReceive)}
          {action("swap", "Swap")}
        </div>
        <div className="hw-tabs hs-tabs">
          <span>Tokens</span>
          <span className="on">Providers</span>
          <span>Activity</span>
        </div>
        <div className="hs-grid">
          {PROVIDERS.map((provider, k) => (
            <div className={`hs-card tone-${provider.tone}`} key={provider.name} style={{ "--k": k } as CSSProperties}>
              <img className="hs-icon" src={provider.icon} alt="" />
              <b>{provider.name}</b>
              {provider.balance ? (
                <span className="hs-strip">
                  <span className="hs-coins">
                    {provider.coins?.map((coin) => (
                      <img key={coin} src={coin} alt="" />
                    ))}
                  </span>
                  <Scramble text={provider.balance} intro />
                </span>
              ) : (
                <em className="hs-soon">Coming soon</em>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type WalletHomeProps = {
  mode: HomeMode;
  onMode: (mode: HomeMode) => void;
  /** 叠在前面的是哪张卡，也就是当前账户。设计稿默认是 Incognito。 */
  front?: HomeAccount;
  onFront?: (account: HomeAccount) => void;
  tab?: HomeTab;
  onTab?: (tab: HomeTab) => void;
  onDeposit?: () => void;
  onWithdraw?: () => void;
  onSend?: () => void;
  onReceive?: () => void;
  /** 演示手指停在后面那张卡上。 */
  hand?: boolean;
};

export function WalletHome({
  mode,
  onMode,
  front = "incognito",
  onFront,
  tab = "tokens",
  onTab,
  onDeposit,
  onWithdraw,
  onSend,
  onReceive,
  hand = false,
}: WalletHomeProps) {
  const shield = mode === "shield";
  return (
    <div className={`hw-home${shield ? " is-shield" : ""}`}>
      <div className="hw-top">
        <img className="hw-ava" src={IMG.avatar} alt="" />
        <span className="hw-name">Liam</span>
        <div className="hw-seg" role="group" aria-label="Wallet or Shield">
          <i className="hw-seg-thumb" aria-hidden="true" />
          <button type="button" className={shield ? "" : "on"} aria-pressed={!shield} onClick={() => onMode("wallet")}>
            Wallet
          </button>
          <button type="button" className={shield ? "on" : ""} aria-pressed={shield} onClick={() => onMode("shield")}>
            Shield
          </button>
        </div>
        <span className="hw-menu" aria-hidden="true">
          <Icon name="menu" />
        </span>
      </div>

      {shield ? (
        <ShieldView key="shield" onSend={onSend} onReceive={onReceive} />
      ) : (
        <WalletView
          key="wallet"
          front={front}
          onFront={onFront}
          tab={tab}
          onTab={onTab}
          onDeposit={onDeposit}
          onWithdraw={onWithdraw}
          hand={hand}
        />
      )}
    </div>
  );
}
