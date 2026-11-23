/**
 * How Noir Wallet works：沿用方向 1 的路径图。
 * 白点（公开可见）走进 Shield，出来变成金点（私有），再分到 DeFi 的三个去处。
 * 所有动画共用 4.8s 周期：0–25% 进 Shield，38–62% 到私有账户，64–86% 分到 DeFi。
 */
import { Icon } from "./Icon";

const PERIOD = "4.8s";

type Hop = { path: string; points: string; times: string; fade: string; fadeTimes: string };

const HOP_IN: Hop = {
  path: "M2 20 H94",
  points: "0;1;1",
  times: "0;0.25;1",
  fade: "0;1;1;0;0",
  fadeTimes: "0;0.03;0.22;0.25;1",
};
const HOP_OUT: Hop = {
  path: "M2 20 H94",
  points: "0;0;1;1",
  times: "0;0.38;0.62;1",
  fade: "0;0;1;1;0;0",
  fadeTimes: "0;0.38;0.41;0.59;0.62;1",
};
const FAN = ["M2 100 C44 100 44 28 86 28", "M2 100 H86", "M2 100 C44 100 44 172 86 172"];
const HOP_FAN = { points: "0;0;1;1", times: "0;0.64;0.86;1", fade: "0;0;1;1;0;0", fadeTimes: "0;0.64;0.67;0.83;0.86;1" };

function Packet({ hop, path, delay, tone }: { hop: Omit<Hop, "path">; path: string; delay: number; tone: "pub" | "priv" }) {
  return (
    <circle r="4" className={`packet packet-${tone}`} opacity="0">
      <animateMotion
        dur={PERIOD}
        repeatCount="indefinite"
        path={path}
        keyPoints={hop.points}
        keyTimes={hop.times}
        calcMode="linear"
        begin={`${delay}s`}
      />
      <animate
        attributeName="opacity"
        dur={PERIOD}
        repeatCount="indefinite"
        values={hop.fade}
        keyTimes={hop.fadeTimes}
        begin={`${delay}s`}
      />
    </circle>
  );
}

function Wire({ tone }: { tone: "pub" | "priv" }) {
  const hop = tone === "pub" ? HOP_IN : HOP_OUT;
  return (
    <div className={`wire wire-${tone}`} aria-hidden="true">
      <svg viewBox="0 0 96 40" width="96" height="40">
        <path className="wire-line" d={hop.path} />
        {[0, 0.18, 0.36].map((delay) => (
          <Packet key={delay} hop={hop} path={hop.path} delay={delay} tone={tone} />
        ))}
      </svg>
      <span className="p-down">
        <i />
      </span>
    </div>
  );
}

function Fan() {
  return (
    <div className="fan" aria-hidden="true">
      <svg viewBox="0 0 88 200" width="88" height="200">
        {FAN.map((d) => (
          <path key={d} className="wire-line is-amber" d={d} />
        ))}
        {FAN.map((d) => (
          <Packet key={d} hop={HOP_FAN} path={d} delay={0} tone="priv" />
        ))}
      </svg>
      <span className="p-down">
        <i />
      </span>
    </div>
  );
}

export function Workflow() {
  return (
    <section className="sec" id="workflow" aria-labelledby="workflow-title">
      <div className="wrap">
        <h2 className="sec-title" id="workflow-title">
          How Noir Wallet works
        </h2>
        <p className="sec-sub">
          Funds go from your public accounts into Shield, then on to private accounts for DeFi. Watch what stays visible
          along the way.
        </p>

        <div className="flow">
          <div className="node node-pub">
            <b>Public Accounts</b>
            <span className="node-desc">Your everyday addresses. Anyone can look them up.</span>
            <code>
              <i className="dot-w" />
              0x1769…457A8f4 · 500 USDT
            </code>
          </div>
          <Wire tone="pub" />
          <div className="node node-shield">
            <span className="shield-ring" aria-hidden="true" />
            <b>Shield Balance</b>
            <ul className="shield-acts">
              <li>
                <Icon name="send" />
                Send privately
              </li>
              <li>
                <Icon name="receive" />
                Receive privately
              </li>
            </ul>
            <span className="cipher" aria-hidden="true">
              {Array.from({ length: 14 }, (_, k) => (
                <i key={k} style={{ animationDelay: `${k * 90}ms` }} />
              ))}
            </span>
          </div>
          <Wire tone="priv" />
          <div className="node node-priv">
            <b>Private Accounts</b>
            <span className="node-desc">Use DeFi without exposing your on-chain identity.</span>
            <code>
              <i className="dot-g" />
              0x17…4abb · not linked to you
            </code>
          </div>
          <Fan />
          <div className="defi">
            <p className="defi-h">DeFi interactions</p>
            <div className="leaf">Lending</div>
            <div className="leaf">Perps</div>
            <div className="leaf">Cash out</div>
          </div>
        </div>

        <p className="legend">
          <span>
            <i className="dot-w" />
            Publicly visible
          </span>
          <span>
            <i className="dot-g" />
            Private
          </span>
        </p>
      </div>
    </section>
  );
}
