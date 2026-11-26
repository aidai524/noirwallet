import { loadDemo } from "./demoLoader";
import { Icon } from "./Icon";

/**
 * 打开「Try the extension」演示的按钮。
 * cta：首屏主按钮旁的醒目按钮；ghost：页尾的次级按钮。
 * 鼠标移上去或聚焦时就开始加载演示那一包。
 */
export function TryExtension({ onOpen, variant }: { onOpen: () => void; variant: "cta" | "ghost" }) {
  const warm = () => void loadDemo();
  return (
    <button
      type="button"
      className={variant === "cta" ? "btn btn-try" : "btn btn-ghost"}
      onClick={onOpen}
      onPointerEnter={warm}
      onFocus={warm}
    >
      <Icon name="pointer" />
      Try the extension
    </button>
  );
}
