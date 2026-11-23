import { useState } from "react";

/** 手机上提示：钱包是桌面 Chrome 扩展，复制链接回电脑上装。 */
export function DeskNote({ dim = false }: { dim?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    const done = () => setCopied(true);
    if (navigator.clipboard) navigator.clipboard.writeText(window.location.href).then(done, done);
    else done();
  };

  return (
    <div className="desk-note" data-dim={dim ? "" : undefined}>
      <span>Noir Wallet runs in desktop Chrome. Open this page on your computer to install it.</span>
      <button className="btn btn-ghost btn-sm" type="button" onClick={copy}>
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
