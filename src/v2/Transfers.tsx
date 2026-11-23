/** Private Transfers：左边是能点的钱包，右边四步。没人操作时自动按步骤导览，用户点过就停。 */
import { useEffect, useReducer, useRef, useState, type CSSProperties } from "react";
import { STAGES, type Scene } from "./content";
import { prefersReducedMotion, useInView } from "./motion";
import { Wallet } from "./Wallet";
import { INITIAL_WALLET, stageOf, walletReducer } from "./walletModel";

const TOUR_MS = 6500;

export function Transfers() {
  const [state, dispatch] = useReducer(walletReducer, INITIAL_WALLET);
  const [reduced] = useState(prefersReducedMotion);
  const [auto, setAuto] = useState(!reduced);
  const cardRef = useRef<HTMLDivElement>(null);
  const visible = useInView(cardRef, 0.35);
  const current = stageOf(state);

  useEffect(() => {
    if (!auto || !visible) return;
    const next = STAGES[(current + 1) % STAGES.length].scene;
    const id = window.setTimeout(() => dispatch({ type: "scene", scene: next }), current < 0 ? 500 : TOUR_MS);
    return () => window.clearTimeout(id);
  }, [auto, visible, current, state.key]);

  const pick = (scene: Scene) => {
    setAuto(false);
    dispatch({ type: "scene", scene });
  };

  return (
    <section className="sec" id="features" aria-labelledby="features-title">
      <div className="wrap">
        <h2 className="sec-title" id="features-title">
          Private Transfers
        </h2>
        <p className="sec-sub">
          Send, receive and move funds without leaving a public trail. This is the wallet, simulated in your browser.
          Tap through it.
        </p>
        <div className="entry-card" ref={cardRef}>
          <div className="entry-stage">
            <Wallet state={state} dispatch={dispatch} onTouch={() => setAuto(false)} />
          </div>
          <div className="entry-side">
            <ol className="stages">
              {STAGES.map((stage, index) => (
                <li key={stage.scene}>
                  <button
                    type="button"
                    className={`stage${index === current ? " on" : ""}`}
                    aria-current={index === current ? "step" : undefined}
                    onClick={() => pick(stage.scene)}
                  >
                    <span className="stage-k doto">{index + 1}</span>
                    <span className="stage-t">
                      <b>{stage.title}</b>
                      <span>{stage.body}</span>
                    </span>
                    {auto && visible && index === current && (
                      <i className="stage-bar" key={state.key} style={{ "--t": `${TOUR_MS}ms` } as CSSProperties} />
                    )}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
