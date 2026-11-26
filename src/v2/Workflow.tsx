/**
 * How Noir Wallet Works（按设计稿的路径图）：Public Accounts → Shield Balance → Private Accounts → DeFi。
 * 桌面上按设计稿 1154 × 440 的画布排，容器变窄时整张等比缩小；手机上改成竖排。
 * 连线上跑一段高亮，从公开账户一路流到 DeFi。
 */
import { type CSSProperties, type RefObject, useEffect, useRef, useState } from "react";
import { DEFI_LEAVES, IMG } from "./content";
import { Icon } from "./Icon";

const CANVAS_W = 1154;

/** 容器宽度不够放下设计稿画布时的缩放比例；手机竖排时不缩放。 */
function useFit(ref: RefObject<HTMLDivElement | null>) {
  const [k, setK] = useState(1);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setK(Math.min(1, entry.contentRect.width / CANVAS_W));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return k;
}

export function Workflow() {
  const fitRef = useRef<HTMLDivElement>(null);
  const k = useFit(fitRef);

  return (
    <section className="sec works-sec" id="workflow" aria-labelledby="workflow-title">
      <div className="wrap">
        <h2 className="sec-title" id="workflow-title">
          How Noir Wallet Works
        </h2>
        <div ref={fitRef} className="works-fit" style={{ "--k": k } as CSSProperties}>
          <div className="works">
            <div className="wk-box wk-pub">Public Accounts</div>
            <span className="wk-wire" aria-hidden="true">
              <i />
            </span>
            <div className="wk-shield">
              <span className="wk-ring" aria-hidden="true" />
              <div className="wk-core">
                <img src={IMG.shieldGlyph} width={123} height={133} alt="" />
                <b>Shield Balance</b>
              </div>
              <div className="wk-chip wk-send">
                <Icon name="send" />
                <span>Send Privately</span>
              </div>
              <div className="wk-chip wk-recv">
                <Icon name="receive" />
                <span>Receive Privately</span>
              </div>
            </div>
            <span className="wk-wire is-late" aria-hidden="true">
              <i />
            </span>
            <div className="wk-box wk-priv">Private Accounts</div>
            {/* 往三个 DeFi 去的分叉：上下两条弯线 + 中间一条直线 */}
            <svg className="wk-fan" viewBox="0 0 52 172" aria-hidden="true">
              <path className="wk-fan-line" d="M0 86H5C17 86 27 76 27 64V23C27 11 37 1 49 1H52" />
              <path className="wk-fan-line" d="M0 86H52" />
              <path className="wk-fan-line" d="M0 86H5C17 86 27 96 27 108V149C27 161 37 171 49 171H52" />
              <path className="wk-fan-spark" pathLength={100} d="M0 86H5C17 86 27 76 27 64V23C27 11 37 1 49 1H52" />
              <path className="wk-fan-spark" pathLength={100} d="M0 86H52" />
              <path className="wk-fan-spark" pathLength={100} d="M0 86H5C17 86 27 96 27 108V149C27 161 37 171 49 171H52" />
            </svg>
            <div className="wk-defi">
              <b>Defi Interactions</b>
              <ul>
                {DEFI_LEAVES.map((leaf) => (
                  <li key={leaf}>{leaf}</li>
                ))}
              </ul>
              <span className="wk-more" aria-label="and more">
                <i />
                <i />
                <i />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
