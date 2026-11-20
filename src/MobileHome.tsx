/** 窄屏落地页。正文按正常字号重排，主视觉插画仍用桌面那一套缩放。 */
import { useEffect, useRef, useState } from "react";
import OrbitLogos from "./effects/OrbitLogos";
import ParticleImage from "./effects/ParticleImage";
import ThinkingDots from "./effects/ThinkingDots";
import { scrollToSection } from "./scrollToSection";
import { walletLinkProps } from "./walletStore";

const logo = "/figma/imgNoirLogo1.jpg";
const downloadIcon = "/figma/imgVector1.svg";
const ring = "/figma/imgEllipse6113.svg";
const wallet = "/figma/imgA01Home1.png";
const portrait = "/figma/imgImage2.png";

const nav = [
  { id: "features", label: "Features" },
  { id: "workflow", label: "Workflow" },
  { id: "downloads", label: "Downloads" },
  { id: "docs", label: "Docs" },
] as const;

const duties = [
  "Supports Mainly Networks besides Zcash",
  "Asset and account management",
  "Private asset receiving, sending, and move",
  "Switching between Public and Private Modes",
  "Shield Funds management",
  "dApp connections, account selection, authorization, and transaction signing",
];

const tools = ["zcash shield", "near confidential", "railgun", "privacy pool", "ZAMA"];

const flow = [
  { title: "Public Accounts", detail: "Send privately" },
  { title: "Shield Balance", detail: "Shield Funds management" },
  { title: "Private Accounts", detail: "Receive privately" },
  { title: "Defi interactions", detail: "Lending, Perps, Cash out" },
];

/** 把 1164×624 的主视觉缩进屏幕宽度。 */
function HeroStage() {
  const frame = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = frame.current;
    if (!node) return;
    const measure = () => setWidth(node.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const scale = width > 0 ? width / 1164 : 0;

  return (
    <div ref={frame} className="mobile-hero-frame" style={{ height: 624 * scale }}>
      <div className="mobile-hero-stage" style={{ transform: `scale(${scale})` }}>
        <img alt="" className="mobile-hero-ring" src={ring} />
        <OrbitLogos />
        <div className="mobile-hero-wallet">
          <img alt="" src={wallet} />
        </div>
      </div>
    </div>
  );
}

export default function MobileHome() {
  useEffect(() => {
    const header = document.querySelector(".mobile-header");
    const fit = () => {
      const height = header?.getBoundingClientRect().height ?? 108;
      document.documentElement.style.setProperty("--header-offset", `${height}px`);
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div className="mobile-home">
      <header className="mobile-header">
        <div className="mobile-bar">
          <a {...walletLinkProps} className="nav-logo mobile-logo" aria-label="Noir Wallet">
            <img alt="" src={logo} />
          </a>
          <a {...walletLinkProps} className="nav-wordmark mobile-word">
            Noir Wallet
          </a>
          <a {...walletLinkProps} className="nav-install mobile-install">
            <img alt="" src={downloadIcon} />
            Install
          </a>
        </div>
        <nav className="mobile-nav" aria-label="Sections">
          {nav.map((item) => (
            <button key={item.id} type="button" className="nav-link" onClick={() => scrollToSection(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        <section className="mobile-hero">
          <h1>The Privacy-first Multichain Wallet</h1>
          <p>
            Noir Wallet is the privacy-first multichain wallet. Send funds and use DeFi without exposing your balance,
            positions, or on-chain identity. Live on Zcash and major EVMs .
          </p>
          <a {...walletLinkProps} className="mobile-cta">
            Get Noir Wallet
          </a>
          <HeroStage />
        </section>

        <section className="mobile-stats">
          <div>
            <strong>13</strong>
            <span>Supported Networks</span>
            <small>More is coming</small>
          </div>
          <div>
            <strong>100+</strong>
            <span>Supported Tokens</span>
            <small>More is coming</small>
          </div>
        </section>

        <section id="features" className="mobile-transfers">
          <ThinkingDots className="mobile-dots" />
          <div className="mobile-transfers-copy">
            <h2>Private Transfers</h2>
            <article>
              <h3>Send privatley</h3>
            </article>
            <article>
              <h3>Receive privatley</h3>
            </article>
            <article>
              <h3>Move Privatley</h3>
            </article>
          </div>
        </section>

        <section className="mobile-block">
          <h2>Private Defi Access</h2>
          <p>Smoothly switch private account to access DApps</p>
        </section>

        <section className="mobile-block">
          <h2>Core Responsibilities</h2>
          <ul className="mobile-duties">
            {duties.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section id="workflow" className="mobile-block">
          <h2>How Noir wallet works</h2>
          <ol className="mobile-flow">
            {flow.map((step) => (
              <li key={step.title}>
                <strong>{step.title}</strong>
                <span>{step.detail}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mobile-block">
          <h2>Supported Shield Tools</h2>
          <ul className="mobile-tools">
            {tools.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>
        </section>

        <section id="downloads" className="mobile-journey">
          <h2>
            Start your
            <br />
            private on-chain journey.
          </h2>
          <div className="mobile-journey-actions">
            <a {...walletLinkProps} className="mobile-cta">
              Install Wallet
            </a>
            <button id="docs" type="button" className="mobile-docs" onClick={() => scrollToSection("docs")}>
              Docs
            </button>
          </div>
        </section>
      </main>

      <footer className="mobile-footer">
        <div className="mobile-portrait">
          <ParticleImage imageUrl={portrait} className="mobile-portrait-canvas" particleCount={28000} />
        </div>
        <p>© 2026 Noir Privacy Terminal. All rights reserved.</p>
      </footer>
    </div>
  );
}
