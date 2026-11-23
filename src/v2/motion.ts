import { useEffect, useRef, useState, type RefObject } from "react";

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** 元素是否在视口里。once 为 true 时第一次进入后就不再变回 false。 */
export function useInView(ref: RefObject<Element | null>, threshold = 0.2, once = false) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (once && entry.isIntersecting) observer.disconnect();
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, threshold, once]);

  return inView;
}

const DIGITS = "0123456789";
const LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
/** 这些字符保持不动，乱码时数字串的结构不会跳。 */
const KEEP = " ,.…·$:/→+-%’";

function noise(char: string) {
  if (KEEP.includes(char)) return char;
  const pool = /[a-z]/i.test(char) ? LETTERS : DIGITS;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** 把字母和数字换成 *，用来表示“对外不可见”。 */
export function mask(text: string) {
  return text.replace(/[A-Za-z0-9]/g, "*");
}

/**
 * 文字换值时逐字乱码，再从左到右落定，像被加密或解密。
 * intro 为 true 时，首次出现也从打码状态解开。
 */
export function useScramble(text: string, intro = false) {
  const [reduced] = useState(prefersReducedMotion);
  const [shown, setShown] = useState(() => (intro && !reduced ? mask(text) : text));
  // 记录屏幕上正在显示的串。StrictMode 下效果会跑两次，靠它判断还要不要继续解码。
  const current = useRef({ value: shown });

  useEffect(() => {
    if (reduced) return;
    const state = current.current;
    if (state.value === text) return;
    const start = performance.now();
    let raf = 0;
    let lastPaint = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      if (now - lastPaint < 34) {
        raf = requestAnimationFrame(tick);
        return;
      }
      lastPaint = now;
      let out = "";
      let done = true;
      for (let index = 0; index < text.length; index += 1) {
        if (elapsed >= 200 + index * 30) {
          out += text[index];
        } else {
          done = false;
          out += noise(text[index]);
        }
      }
      state.value = out;
      setShown(out);
      if (!done) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, reduced]);

  // 减弱动效时不做乱码，直接显示目标文字。
  return reduced ? text : shown;
}
