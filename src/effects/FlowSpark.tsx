/** 沿现有连线从左向右跑一段高亮，看起来像电流。 */

type LineProps = {
  width: number;
  color: string;
  delay?: string;
};

type PathProps = {
  d: string;
  viewWidth: number;
  viewHeight: number;
  color: string;
  delay?: string;
};

function sparkStyle(color: string, delay: string) {
  return { animationDelay: delay, ["--spark" as string]: color };
}

/** 水平线段上的电流。放在未旋转的外层，方向始终从左到右。 */
export function FlowSpark({ width, color, delay = "0s" }: LineProps) {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute left-0 overflow-visible"
      style={{ top: -3, width, height: 6 }}
      viewBox={`0 0 ${width} 6`}
      fill="none"
    >
      <line
        x1="1"
        y1="3"
        x2={width - 1}
        y2="3"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        pathLength={100}
        className="flow-spark"
        style={sparkStyle(color, delay)}
      />
      <line
        x1="1"
        y1="3"
        x2={width - 1}
        y2="3"
        stroke="#ffffff"
        strokeWidth="1"
        strokeLinecap="round"
        pathLength={100}
        className="flow-spark"
        style={sparkStyle(color, delay)}
      />
    </svg>
  );
}

/** 折线路径上的电流，跟原 SVG 同一 viewBox，会跟着外层翻转。 */
export function FlowPath({ d, viewWidth, viewHeight, color, delay = "0s" }: PathProps) {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible" viewBox={`0 0 ${viewWidth} ${viewHeight}`} fill="none">
      <path d={d} stroke={color} strokeWidth="2.4" strokeLinecap="round" pathLength={100} className="flow-spark" style={sparkStyle(color, delay)} />
      <path d={d} stroke="#ffffff" strokeWidth="1" strokeLinecap="round" pathLength={100} className="flow-spark" style={sparkStyle(color, delay)} />
    </svg>
  );
}
