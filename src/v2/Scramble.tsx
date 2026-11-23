import { useScramble } from "./motion";

type ScrambleProps = {
  text: string;
  /** 首次出现时也从打码状态解开。 */
  intro?: boolean;
  /** 读屏读到的文字，默认就是 text。 */
  label?: string;
  className?: string;
};

/** 乱码过渡的文字。动画中的字符对读屏隐藏，读屏只读最终值。 */
export function Scramble({ text, intro = false, label, className }: ScrambleProps) {
  const shown = useScramble(text, intro);
  return (
    <span className={className}>
      <span aria-hidden="true">{shown}</span>
      <span className="sr">{label ?? text}</span>
    </span>
  );
}
