/**
 * 首屏下面的三块功能介绍（按设计稿）：
 * Private Transfers：左边钱包截图，右边 Send / Receive 两个页签，自动轮播，点过就停；
 * Shield & Unshield：要点 + Public 账户截图（ZEC 一行旁边的一键 Shield 放大标出）；
 * Private Defi Access：钱包连到 DApp 的示意图，连线上跑一段高亮，到达时 DApp 上的账户闪一下。
 */
import { type CSSProperties, type KeyboardEvent, useRef, useState } from "react";
import { PHONES, SHIELD_POINTS, SHOTS, TRANSFER_TABS, frameStyle } from "./content";
import { prefersReducedMotion, useInView } from "./motion";

/** 页签自动轮播的间隔，和 CSS 里进度条的动画时长一致。 */
const ROTATE_MS = 6000;

export function PrivateTransfers() {
  const [reduced] = useState(prefersReducedMotion);
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(!reduced);
  const [hold, setHold] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const visible = useInView(cardRef, 0.4);

  const pick = (index: number, focus = false) => {
    setAuto(false);
    setActive(index);
    if (focus) tabRefs.current[index]?.focus();
  };

  const onKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = TRANSFER_TABS.length - 1;
    const keys: Record<string, number> = {
      ArrowDown: active === last ? 0 : active + 1,
      ArrowRight: active === last ? 0 : active + 1,
      ArrowUp: active === 0 ? last : active - 1,
      ArrowLeft: active === 0 ? last : active - 1,
      Home: 0,
      End: last,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    pick(keys[event.key], true);
  };

  // 进度条走满（动画结束）就换下一个。看不见、鼠标停在卡片上或焦点在里面时暂停。
  const next = () => setActive((index) => (index + 1) % TRANSFER_TABS.length);
  const running = auto && visible && !hold;
  const tab = TRANSFER_TABS[active];

  return (
    <section className="feat" id="features" aria-labelledby="transfers-title">
      <div
        ref={cardRef}
        className={`pt-card${auto ? " is-auto" : ""}${running ? "" : " is-held"}`}
        style={{ "--rotate": `${ROTATE_MS}ms` } as CSSProperties}
        onPointerEnter={() => setHold(true)}
        onPointerLeave={() => setHold(false)}
        onFocus={() => setHold(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHold(false);
        }}
      >
        <div className="pt-shot" id="pt-panel" role="tabpanel" aria-labelledby={`pt-tab-${tab.id}`}>
          {TRANSFER_TABS.map((item, index) => {
            const shot = PHONES[item.shot];
            const on = index === active;
            return (
              <img
                key={item.id}
                className={on ? "on" : undefined}
                src={shot.src}
                width={shot.width}
                height={shot.height}
                style={frameStyle(shot)}
                loading="lazy"
                alt={on ? item.alt : ""}
                aria-hidden={on ? undefined : true}
              />
            );
          })}
        </div>
        <div className="pt-side">
          <h2 className="feat-title" id="transfers-title">
            Private Transfers
          </h2>
          <div className="pt-tabs" role="tablist" aria-label="Private transfers" aria-orientation="vertical">
            {TRANSFER_TABS.map((item, index) => {
              const on = index === active;
              return (
                <button
                  key={item.id}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  type="button"
                  role="tab"
                  id={`pt-tab-${item.id}`}
                  className={`pt-tab${on ? " on" : ""}`}
                  aria-selected={on}
                  aria-controls="pt-panel"
                  tabIndex={on ? 0 : -1}
                  onClick={() => pick(index)}
                  onKeyDown={onKey}
                >
                  <span className="pt-bar" aria-hidden="true">
                    {on && <i key={active} onAnimationEnd={next} />}
                  </span>
                  <b className="doto">{item.title}</b>
                  <span className="pt-body">{item.body}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ShieldUnshield() {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, 0.25, true);
  const shot = PHONES.shieldToken;
  return (
    <section className="feat" aria-labelledby="shield-title">
      <div ref={ref} className={`feat-row su${seen ? " is-in" : ""}`}>
        <div className="su-copy">
          <h2 className="feat-title" id="shield-title">
            Shield &amp; Unshield
          </h2>
          <ul className="su-points">
            {SHIELD_POINTS.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
        <div className="su-shot">
          <img
            src={shot.src}
            width={shot.width}
            height={shot.height}
            style={frameStyle(shot)}
            loading="lazy"
            alt="Noir Wallet on the Public account ($1,406.56): the ZEC row, worth $1,220.23, called out with its one-click Shield button."
          />
        </div>
      </div>
    </section>
  );
}

export function DefiAccess() {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, 0.25, true);
  const shot = SHOTS.defi;
  return (
    <section className="feat" aria-labelledby="defi-title">
      <div ref={ref} className={`feat-row da${seen ? " is-in" : ""}`}>
        <div className="da-copy">
          <h2 className="feat-title" id="defi-title">
            Private Defi Access
          </h2>
          <p>Smoothly switch private account to access DApps</p>
        </div>
        <div className="da-art">
          <img
            src={shot.src}
            width={shot.width}
            height={shot.height}
            loading="lazy"
            alt="Noir Wallet on its Incognito account, connected to app.aave.com. The DApp sees a separate address, 0x5b…fed7, instead of your public one."
          />
          {/* 图里那条虚线的走向（按 2000 × 1433 的原图坐标），高亮从钱包底栏跑到 DApp 上的账户 */}
          <svg className="da-wire" viewBox="0 0 2000 1433" preserveAspectRatio="none" aria-hidden="true">
            <path pathLength={100} d="M744 1347.5H1090.5V439.5H1578" />
          </svg>
          <span className="da-ping" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
