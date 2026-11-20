import { scrollToSection } from "./scrollToSection";
import { walletLinkProps } from "./walletStore";

const imgNoirLogo1 = "/figma/imgNoirLogo1.jpg";
const imgVector1 = "/figma/imgVector1.svg";

const links = [
  { id: "features", label: "Features", left: 574.5 },
  { id: "workflow", label: "Workflow", left: 711.5 },
  { id: "downloads", label: "Downloads", left: 844.5 },
  { id: "docs", label: "Docs", left: 957.5 },
] as const;

type SiteHeaderProps = {
  scale: number;
};

/** 固定在视口顶部的菜单。页面缩放时和画布同一比例。 */
export default function SiteHeader({ scale }: SiteHeaderProps) {
  return (
    <header
      className="fixed top-0 left-1/2 z-50 -translate-x-1/2 overflow-hidden bg-black"
      style={{ width: 1512 * scale, height: 82 * scale }}
    >
      <div
        className="relative h-[82px] w-[1512px]"
        style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        <a
          {...walletLinkProps}
          aria-label="Noir Wallet"
          className="nav-logo absolute top-[21px] left-[80px] size-[40px] cursor-pointer"
        >
          <img alt="" className="size-full object-cover" src={imgNoirLogo1} />
        </a>
        <a
          {...walletLinkProps}
          className="nav-wordmark absolute top-[29px] left-[126px] cursor-pointer text-[20px] font-medium text-transparent no-underline"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          Noir Wallet
        </a>
        {links.map((link) => (
          <button
            key={link.id}
            type="button"
            onClick={() => scrollToSection(link.id)}
            className="nav-link absolute top-[32px] -translate-x-1/2 cursor-pointer border-0 bg-transparent p-0 text-[16px] text-white capitalize"
            style={{ left: link.left, fontFamily: "Doto, sans-serif", fontVariationSettings: '"ROND" 0' }}
          >
            {link.label}
          </button>
        ))}
        <a
          {...walletLinkProps}
          className="nav-install absolute top-[21px] right-[80px] flex h-[40px] w-[122px] cursor-pointer items-center justify-center gap-[6px] rounded-[4px] bg-[#00d18a] text-[14px] text-black no-underline"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          <img alt="" src={imgVector1} className="h-[10px] w-[10px]" />
          Install Wallet
        </a>
      </div>
    </header>
  );
}
