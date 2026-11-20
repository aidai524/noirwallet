/** 主视觉圆环上的链标。绕圆心匀速转动，图标自身保持正向。 */
import type { ReactNode } from "react";

const zec = "/figma/imgGroup1948762160.svg";
const eth = "/figma/imgGroup1948760748.svg";
const bnb = "/figma/imgGroup1948762156.svg";
const arb = "/figma/imgGroup1948762158.svg";
const atom = "/figma/imgGroup1948762989.svg";

type Logo = {
  id: string;
  dx: number;
  dy: number;
  node: ReactNode;
};

/** 按角度排序，对应设计稿可见弧上的初始位置。 */
const originals: Logo[] = [
  {
    id: "atom",
    dx: -455.5,
    dy: -101.5,
    node: <img alt="" className="size-full" src={atom} />,
  },
  {
    id: "base",
    dx: -348.5,
    dy: -302.5,
    node: (
      <div className="relative size-full">
        <div className="absolute inset-0 rounded-[12px] bg-white" />
        <div className="absolute size-[33.75px] rounded-[1px] bg-[#0038ff]" style={{ left: 13.125, top: 13.125 }} />
      </div>
    ),
  },
  { id: "zec", dx: -123.5, dy: -447.5, node: <img alt="" className="size-full" src={zec} /> },
  {
    id: "eth",
    dx: 122.5,
    dy: -447.5,
    node: (
      <div className="relative size-full">
        <div className="absolute inset-0 rounded-[12px] bg-[#6284f5]" />
        <img alt="" className="absolute h-[36.49px] w-[22.53px]" src={eth} style={{ left: 17.53, top: 12.5 }} />
      </div>
    ),
  },
  { id: "bnb", dx: 347.5, dy: -302.5, node: <img alt="" className="size-full" src={bnb} /> },
  { id: "arb", dx: 450.5, dy: -101.5, node: <img alt="" className="size-full" src={arb} /> },
];

/**
 * 设计稿只在上半圈放了 6 个标，下半圈被遮罩裁掉后会空出约 200°。
 * 用同样的间距把同一组标再排进这段空隙，转进来时不会出现空档。
 */
function withContinuousCopies(list: Logo[]): Logo[] {
  const placed = list.map((logo) => {
    const radius = Math.hypot(logo.dx, logo.dy);
    let angle = Math.atan2(logo.dy, logo.dx);
    if (angle < 0) angle += Math.PI * 2;
    return { ...logo, radius, angle };
  });
  const first = placed[0].angle;
  const last = placed[placed.length - 1].angle;
  const step = (first + Math.PI * 2 - last) / (placed.length + 1);
  const copies = placed.map((logo, index) => {
    const angle = last + step * (index + 1);
    return {
      id: `${logo.id}-next`,
      dx: Math.cos(angle) * logo.radius,
      dy: Math.sin(angle) * logo.radius,
      node: logo.node,
    };
  });
  return [...placed, ...copies];
}

const logos = withContinuousCopies(originals);

export default function OrbitLogos() {
  return (
    <div className="noir-orbit-spin pointer-events-none absolute size-0" style={{ left: 582.5, top: 528.5 }}>
      {logos.map((logo) => (
        <div
          key={logo.id}
          className="absolute size-[60px]"
          style={{ left: logo.dx, top: logo.dy, transform: "translate(-50%, -50%)" }}
        >
          <div className="noir-orbit-upright size-full">{logo.node}</div>
        </div>
      ))}
    </div>
  );
}
