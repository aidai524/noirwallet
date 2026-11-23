/** 首屏右侧的钱包：新版首页套一个卡片外框，只开放 Wallet / Shield 开关。 */
import { WalletHome, type HomeMode } from "./WalletHome";

export type HeroMode = HomeMode;

type HeroWalletProps = {
  mode: HeroMode;
  onMode: (mode: HeroMode) => void;
};

export function HeroWallet({ mode, onMode }: HeroWalletProps) {
  return (
    <div className="hw">
      <WalletHome mode={mode} onMode={onMode} />
    </div>
  );
}
