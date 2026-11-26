/**
 * 页面最底部的雕像。先照常显示图片；快滚到这里时加载粒子效果（单独一包），
 * 换成由粒子拼成的同一张图，鼠标划过会把粒子拨散，随后聚回原样。
 * 减少动态效果、没有 WebGL 或出错时，一直显示原图。
 */
import { useEffect, useRef, useState } from "react";
import { SHOTS } from "./content";
import { prefersReducedMotion } from "./motion";

export function Statue() {
  const boxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!box || !img || !canvas || prefersReducedMotion()) return;

    let stop: (() => void) | undefined;
    let cancelled = false;
    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        near.disconnect();
        import("./particles")
          .then(({ createParticleImage }) => {
            if (cancelled) return;
            stop = createParticleImage({
              box,
              img,
              canvas,
              hitArea: box.closest("footer") ?? box,
              onReady: () => setLive(true),
              onFail: () => setLive(false),
            });
          })
          .catch(() => setLive(false));
      },
      { rootMargin: "600px 0px" },
    );
    near.observe(box);
    return () => {
      cancelled = true;
      near.disconnect();
      stop?.();
    };
  }, []);

  const shot = SHOTS.statue;
  return (
    <div ref={boxRef} className={`statue${live ? " is-live" : ""}`}>
      <img ref={imgRef} src={shot.src} width={shot.width} height={shot.height} alt="" loading="lazy" />
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  );
}
