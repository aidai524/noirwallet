/**
 * 首屏（按设计稿）：点阵铺底，左边文案，右边新版钱包，点阵上标着支持的链。
 * 钱包切到 Shield 时，从钱包发出一道扫描波：扫过的点闪一下，链标记依次套上护盾，
 * 钱包换成 Shield 视图（各隐私服务商的余额）。悬停点阵显示每个点的编号。
 */
import { useEffect, useRef, useState } from "react";
import { walletLinkProps } from "../walletStore";
import { IMG } from "./content";
import { DeskNote } from "./DeskNote";
import { HeroWallet, type HeroMode } from "./HeroWallet";
import { Icon } from "./Icon";
import { prefersReducedMotion, useInView } from "./motion";
import { Scramble } from "./Scramble";

type Tone = "blue" | "gold" | "base";
type Kind = "wide" | "mid" | "band";

/**
 * 点阵上的链。
 * wide：设计稿 1440 宽时的位置，x 是文案列左边缘加上文案列宽的比例 fx（Arbitrum 用固定左移 dx），row 是行号。
 * mid：1000–1399 宽时左边留白不够，后三个挪到文案下方，fx 按文案列到钱包之间的宽度算，dr 是文案下方第几行。
 * band：1000 以下，全部排在文案下方，fx 按屏宽算。
 */
const MARKS: {
  name: string;
  tone: Tone;
  wide: { fx?: number; dx?: number; row: number };
  mid?: { fx: number; dr: number };
  band: { fx: number; dr: number };
}[] = [
  { name: "Ethereum", tone: "blue", wide: { fx: 0.583, row: 4 }, band: { fx: 0.6, dr: 3 } },
  { name: "Zcash", tone: "gold", wide: { fx: 0.94, row: 9 }, band: { fx: 0.08, dr: 7 } },
  { name: "Arbitrum", tone: "blue", wide: { dx: -93, row: 26 }, mid: { fx: 0.02, dr: 3 }, band: { fx: 0.64, dr: 11 } },
  { name: "BNB Chain", tone: "gold", wide: { fx: 0.487, row: 31 }, mid: { fx: 0.5, dr: 7 }, band: { fx: 0.1, dr: 15 } },
  { name: "Base", tone: "base", wide: { fx: 0.308, row: 37 }, mid: { fx: 0.22, dr: 10 }, band: { fx: 0.5, dr: 19 } },
];

const WAVE_MS = 1400;
const TAU = Math.PI * 2;
/** 点阵的灰点：#1D1D1D；压在文案下面的再暗一档，保证文字清楚。 */
const DOT = "29,29,29";
const DOT_QUIET = "17,17,17";

type Parts = {
  stage: HTMLElement;
  canvas: HTMLCanvasElement;
  tip: HTMLElement;
  marks: HTMLElement[];
  /** 文案列，用来算设计稿里各个标记的横向位置。 */
  column: HTMLElement;
  /** 钱包所在的格子，用来避开钱包、确定扫描波的起点。 */
  phone: HTMLElement;
};

type Field = {
  setMode: (mode: HeroMode) => void;
  destroy: () => void;
};

function clamp01(value: number) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function createField({ stage, canvas, tip, marks, column, phone }: Parts, reduced: boolean): Field {
  const context = canvas.getContext("2d");
  if (!context) return { setMode: () => {}, destroy: () => {} };
  const ctx = context;

  let cols = 101;
  let rows = 41;
  let total = cols * rows;
  let cell = 1;
  let width = 0;
  let height = 0;
  let ratio = 1;
  let dims: { x0: number; y0: number; x1: number; y1: number }[] = [];
  let markIndex: number[] = [];
  let origin = { x: 0, y: 0 };
  let reach = 1;
  let hover: { x: number; y: number } | null = null;

  const born = performance.now();
  let reveal = reduced ? 1 : 0;
  let waveAt = -1;
  let raf = 0;
  let pending = 0;

  const pos = (index: number) => ({
    x: ((index % cols) + 0.5) * cell,
    y: (Math.floor(index / cols) + 0.5) * cell,
  });
  const dimmed = (x: number, y: number) => dims.some((d) => x > d.x0 && x < d.x1 && y > d.y0 && y < d.y1);

  function layout() {
    const viewport = window.innerWidth;
    // 设计稿的摆法要求文案左边至少留 180px 给 Arbitrum，也就是视口 ≥1400。
    const kind: Kind = viewport >= 1400 ? "wide" : viewport >= 1000 ? "mid" : "band";
    cols = kind === "band" ? (viewport < 760 ? 44 : 72) : 101;
    width = canvas.clientWidth;
    cell = width / cols;

    const box = canvas.getBoundingClientRect();
    const measure = (selector: string) =>
      Array.from(stage.querySelectorAll<HTMLElement>(selector))
        .map((node) => ({ rect: node.getBoundingClientRect(), pad: Number(node.dataset.dim) || 12 }))
        .filter(({ rect }) => rect.width > 0 && rect.height > 0)
        .map(({ rect, pad }) => ({
          x0: rect.left - box.left - pad,
          y0: rect.top - box.top - pad,
          x1: rect.right - box.left + pad,
          y1: rect.bottom - box.top + pad,
        }));

    let copyRow = 0;
    measure(".hero-copy [data-dim]").forEach((d) => {
      copyRow = Math.max(copyRow, Math.ceil(d.y1 / cell));
    });
    // 窄屏时钱包会往上压住点阵底部 64px，多留几行，最下面的标记不会被盖住。
    rows = kind === "band" ? copyRow + 31 : Math.max(41, copyRow + (kind === "mid" ? 13 : 3));
    total = cols * rows;
    height = Math.round(cell * rows);
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.height = `${height}px`;
    dims = measure("[data-dim]").filter((d) => d.y1 > 0 && d.y0 < height);

    const col = column.getBoundingClientRect();
    const wrapLeft = col.left - box.left;
    const wrapWidth = col.width;
    const phoneBox = phone.getBoundingClientRect();
    const walletLeft = phoneBox.left - box.left;
    const cards = phone.querySelector(".hw-cards")?.getBoundingClientRect() ?? phoneBox;
    origin = { x: cards.left + cards.width / 2 - box.left, y: cards.top + cards.height / 2 - box.top };
    reach = Math.hypot(width, height) * 0.9;

    markIndex = marks.map((node, k) => {
      const mark = MARKS[k];
      let x: number;
      let row: number;
      if (kind === "band") {
        x = mark.band.fx * width;
        row = copyRow + mark.band.dr;
      } else if (kind === "mid" && mark.mid) {
        x = wrapLeft + mark.mid.fx * (walletLeft - 24 - wrapLeft);
        row = copyRow + mark.mid.dr;
      } else {
        x = mark.wide.dx !== undefined ? wrapLeft + mark.wide.dx : wrapLeft + (mark.wide.fx ?? 0) * wrapWidth;
        row = mark.wide.row;
      }
      const c = Math.min(cols - 2, Math.max(1, Math.round(x / cell - 0.5)));
      const r = Math.min(rows - 2, Math.max(1, row));
      const index = r * cols + c;
      const p = pos(index);
      node.style.left = `${canvas.offsetLeft + p.x}px`;
      node.style.top = `${canvas.offsetTop + p.y}px`;
      const label = node.firstElementChild as HTMLElement | null;
      node.toggleAttribute("data-flip", p.x + 26 + (label?.offsetWidth ?? 80) > width - 8);
      // 扫描波到达这个标记的时间，CSS 用它错开每个标记套上护盾的时刻。
      const delay = (Math.hypot(p.x - origin.x, p.y - origin.y) / reach) * WAVE_MS;
      node.style.setProperty("--wave", `${Math.round(delay)}ms`);
      return index;
    });
    draw(performance.now());
  }

  function draw(now: number) {
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const r = Math.max(1.05, cell * 0.13);
    const sweep = waveAt < 0 ? -1 : ((now - waveAt) / WAVE_MS) * reach;
    const band = cell * 2.6;

    for (let index = 0; index < total; index += 1) {
      if (markIndex.includes(index)) continue;
      const p = pos(index);
      const quiet = dimmed(p.x, p.y);
      // 点本身是不透明的 #1D1D1D，文案背后再暗一档；alpha 只用于开场从左到右显现。
      const fade = reveal < 1 ? clamp01((reveal * 1.25 - (index % cols) / cols) * 5) : 1;
      let color = quiet ? DOT_QUIET : DOT;
      let alpha = fade;
      let radius = r;
      if (hover && !quiet) {
        const dx = (p.x - hover.x) / cell;
        const dy = (p.y - hover.y) / cell;
        const lift = 0.85 - (dx * dx + dy * dy) * 0.035;
        if (lift > 0.12) {
          color = "255,255,255";
          alpha = lift * fade;
        }
      }
      if (sweep > 0 && !quiet) {
        const k = 1 - Math.abs(Math.hypot(p.x - origin.x, p.y - origin.y) - sweep) / band;
        if (k > 0) {
          color = "61,255,190";
          alpha = Math.min(0.95, 0.12 + k * 0.6) * fade;
          radius = r * (1 + k * 0.7);
        }
      }
      if (alpha <= 0.004) continue;
      ctx.fillStyle = `rgba(${color},${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, TAU);
      ctx.fill();
    }
  }

  function step(now: number) {
    raf = 0;
    let busy = false;
    if (reveal < 1) {
      reveal = clamp01((now - born) / 1100);
      busy = true;
    }
    if (waveAt >= 0) {
      if (now - waveAt > WAVE_MS) waveAt = -1;
      else busy = true;
    }
    draw(now);
    if (busy) raf = requestAnimationFrame(step);
  }

  const kick = () => {
    if (!raf) raf = requestAnimationFrame(step);
  };

  const onMove = (event: PointerEvent) => {
    const box = canvas.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    hover = { x, y };
    const c = Math.min(cols - 1, Math.max(0, Math.floor(x / cell)));
    const r = Math.min(rows - 1, Math.max(0, Math.floor(y / cell)));
    const index = r * cols + c;
    const p = pos(index);
    const k = markIndex.indexOf(index);
    if (k < 0 && dimmed(p.x, p.y)) {
      tip.classList.remove("on");
    } else {
      tip.textContent = k > -1 ? MARKS[k].name : `#${(index + 1).toLocaleString("en-US")}`;
      tip.style.left = `${canvas.offsetLeft + p.x}px`;
      tip.style.top = `${canvas.offsetTop + p.y}px`;
      tip.classList.add("on");
    }
    kick();
  };
  const onLeave = () => {
    hover = null;
    tip.classList.remove("on");
    kick();
  };

  const schedule = () => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => {
      pending = 0;
      layout();
    });
  };
  const observer = new ResizeObserver(schedule);
  observer.observe(stage);
  observer.observe(phone);
  document.fonts?.ready.then(schedule);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerleave", onLeave);
  layout();
  kick();

  return {
    setMode(next) {
      if (next === "shield" && !reduced) {
        waveAt = performance.now();
        kick();
      }
    },
    destroy() {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(pending);
      observer.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    },
  };
}

/** 网络和代币数量。滚到这里时数字从打码状态解开。 */
function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, 0.5, true);
  return (
    <div ref={ref} className="hero-wrap stats">
      <div className="stat">
        <div className="stat-top">
          <b className="stat-num">
            <Scramble text={seen ? "5" : "*"} label="5" />
          </b>
          <span className="stat-icons" aria-hidden="true">
            <img src={IMG.zecChain} alt="" />
            <span className="evm-grid">
              <img src={IMG.ethChip} alt="" />
              <img src={IMG.arbChip} alt="" />
              <i className="base" />
              <img className="bnb" src={IMG.bnbChip} alt="" />
            </span>
            <span className="ico-sol soon">
              <img src={IMG.solGlyph} alt="" />
            </span>
            <span className="ico-btc soon">
              <img src={IMG.btc} alt="" />
            </span>
            <img className="soon" src={IMG.nearChain} alt="" />
          </span>
        </div>
        <p className="stat-title">Supported Networks</p>
        <p className="stat-sub">Soon Solana, Bitcoin, NEAR</p>
      </div>
      <div className="stat">
        <div className="stat-top">
          <b className="stat-num">
            <Scramble text={seen ? "100+" : "***+"} label="100+" />
          </b>
          <span className="stat-coins" aria-hidden="true">
            <img src={IMG.zecCoin} alt="" />
            <img src={IMG.usdt} alt="" />
            <img src={IMG.usdc} alt="" />
            <img src={IMG.eth} alt="" />
          </span>
        </div>
        <p className="stat-title">Supported Tokens</p>
        <p className="stat-sub">More is coming</p>
      </div>
    </div>
  );
}

export function Hero() {
  const [reduced] = useState(prefersReducedMotion);
  const [mode, setMode] = useState<HeroMode>("wallet");
  const [auto, setAuto] = useState(!reduced);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const markRefs = useRef<(HTMLDivElement | null)[]>([]);
  const field = useRef<Field | null>(null);
  const visible = useInView(stageRef, 0.25);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const tip = tipRef.current;
    const column = columnRef.current;
    const phone = phoneRef.current;
    if (!stage || !canvas || !tip || !column || !phone) return;
    const marks = markRefs.current.filter((node): node is HTMLDivElement => node !== null);
    const instance = createField({ stage, canvas, tip, marks, column, phone }, reduced);
    field.current = instance;
    return () => {
      instance.destroy();
      field.current = null;
    };
  }, [reduced]);

  useEffect(() => {
    field.current?.setMode(mode);
  }, [mode]);

  // 自动在 Wallet / Shield 之间来回切，用户点过开关就停。
  useEffect(() => {
    if (!auto || !visible) return;
    const id = window.setTimeout(
      () => setMode((current) => (current === "wallet" ? "shield" : "wallet")),
      mode === "wallet" ? 4500 : 5200,
    );
    return () => window.clearTimeout(id);
  }, [auto, visible, mode]);

  const choose = (next: HeroMode) => {
    setAuto(false);
    setMode(next);
  };

  return (
    <section className={`hero is-${mode}`} aria-labelledby="hero-title">
      <div ref={stageRef} className="hero-stage">
        <div className="hero-copy">
          <div ref={columnRef} className="hero-wrap">
            <div className="inner" data-dim="26">
              <h1 id="hero-title">The Privacy-first Multichain Wallet</h1>
              <p className="lede">
                Noir Wallet is the privacy-first multichain wallet. Send funds and use DeFi without exposing your
                balance, positions, or on-chain identity. Live on Zcash and major EVMs.
              </p>
              <div className="cta-row">
                <a className="btn" {...walletLinkProps}>
                  Get Noir Wallet
                </a>
                {/* 现有官网的 Docs 还没有文档地址，先指向页尾的 Docs。 */}
                <a className="btn btn-ghost" href="#docs">
                  Docs
                  <Icon name="external" />
                </a>
              </div>
              <DeskNote />
            </div>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          className="field"
          role="img"
          aria-label="A field of dots, with the networks Noir Wallet supports marked on it: Ethereum, Zcash, Arbitrum, BNB Chain and Base."
        />
        {MARKS.map((mark, k) => (
          <div
            key={mark.name}
            ref={(node) => {
              markRefs.current[k] = node;
            }}
            className={`chain-mark tone-${mark.tone}`}
            aria-hidden="true"
          >
            <span>{mark.name}</span>
          </div>
        ))}
        <div ref={tipRef} className="tip doto" aria-hidden="true" />
      </div>

      <div className="hero-phone-layer">
        <div className="hero-wrap">
          <div ref={phoneRef} className="hero-phone">
            <HeroWallet mode={mode} onMode={choose} />
          </div>
        </div>
      </div>

      <div className="hero-below">
        <Stats />
      </div>

      <p className="sr" aria-live="polite">
        {mode === "shield" ? "Shield view: your balance across privacy providers." : "Wallet view."}
      </p>
    </section>
  );
}
