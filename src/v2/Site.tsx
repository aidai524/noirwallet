/** 新版官网：Demo Day 方向 1 的版式和动效，内容换成官网介绍。 */
import { walletLinkProps } from "../walletStore";
import { IMG, TOOLS } from "./content";
import { DeskNote } from "./DeskNote";
import { Hero } from "./Hero";
import { Icon } from "./Icon";
import { Transfers } from "./Transfers";
import { Workflow } from "./Workflow";

function SiteHeader() {
  return (
    <header className="site-head">
      <div className="wrap">
        <a className="brand" href="#top" aria-label="Noir Wallet, back to top">
          <img src={IMG.logo} alt="" />
          <span>Noir Wallet</span>
        </a>
        <nav className="site-nav" aria-label="Site">
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <a href="#downloads">Downloads</a>
          <a href="#docs">Docs</a>
        </nav>
        <a className="btn btn-sm" {...walletLinkProps}>
          <Icon name="download" />
          Install Wallet
        </a>
      </div>
    </header>
  );
}

/** 支持的隐私服务商。还没接入的置灰并标 Soon。 */
function ShieldTools() {
  return (
    <section className="sec" id="tools" aria-labelledby="tools-title">
      <div className="wrap">
        <h2 className="sec-title" id="tools-title">
          Supported Shield Tools
        </h2>
        <p className="sec-sub">Shield through Zcash Shield and NEAR Confidential today. More are on the way.</p>
        <ul className="tool-grid">
          {TOOLS.map((tool) => (
            <li key={tool.name} className={`tool${tool.soon ? " is-soon" : ""}`}>
              <img src={tool.icon} alt="" />
              <b>{tool.name}</b>
              {tool.soon && <em>Soon</em>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Journey() {
  return (
    <section className="end" id="downloads" aria-labelledby="end-title">
      <div className="wrap">
        <h2 id="end-title">Start your private on-chain journey.</h2>
        <p>
          Noir Wallet for Chrome. Live on <b>Zcash</b> and <b>major EVMs</b>.
        </p>
        <div className="cta-row">
          <a className="btn" {...walletLinkProps}>
            <Icon name="download" />
            Install Wallet
          </a>
          {/* 现有官网的 Docs 也还没有文档地址，这里保持同样的占位。 */}
          <a className="btn btn-ghost" id="docs" href="#docs">
            Docs
          </a>
        </div>
        <DeskNote />
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="wrap">
        <span>© 2026 Noir Privacy Terminal. All rights reserved.</span>
        <nav aria-label="Footer">
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <a href="#downloads">Downloads</a>
        </nav>
      </div>
    </footer>
  );
}

export function Site() {
  return (
    <>
      <SiteHeader />
      <main id="top">
        <Hero />
        <Transfers />
        <Workflow />
        <ShieldTools />
        <Journey />
      </main>
      <SiteFooter />
    </>
  );
}
