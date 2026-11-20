import { useEffect, useRef } from "react";

type ParticleImageProps = {
  imageUrl: string;
  className?: string;
  particleCount?: number;
  particleSize?: number;
  particleOpacity?: number;
  speed?: number;
  noiseScale?: number;
  noiseStrength?: number;
  damping?: number;
  lifespan?: number;
  showImage?: boolean;
  imageOpacity?: number;
  backgroundColor?: string;
  cursorInteraction?: boolean;
  cursorStrength?: number;
  cursorRadius?: number;
  paused?: boolean;
  dpr?: number;
};

/** 从图片亮部采样粒子，让肖像随流场散开再回到原位。 */
export default function ParticleImage({
  imageUrl,
  className,
  particleCount = 90000,
  particleSize = 1.35,
  particleOpacity = 0.9,
  speed = 0.85,
  noiseScale = 0.0022,
  noiseStrength = 0.42,
  damping = 0.9,
  lifespan = 110,
  showImage = false,
  imageOpacity = 0.2,
  backgroundColor = "#000000",
  cursorInteraction = true,
  cursorStrength = 0.35,
  cursorRadius = 140,
  paused = false,
  dpr = 1,
}: ParticleImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    const image = new Image();
    image.src = imageUrl;
    let disposed = false;
    let raf = 0;
    let visible = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0, y: 0, vx: 0, vy: 0, active: false };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(dpr, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
    };

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
      const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
      pointer.vx = x - pointer.x;
      pointer.vy = y - pointer.y;
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
      pointer.vx = 0;
      pointer.vy = 0;
    };

    const start = () => {
      if (disposed) return;
      resize();
      const width = canvas.width;
      const height = canvas.height;
      const sample = document.createElement("canvas");
      sample.width = width;
      sample.height = height;
      const sampleContext = sample.getContext("2d", { willReadFrequently: true });
      if (!sampleContext) return;

      const coverScale = Math.max(width / image.width, height / image.height);
      const drawWidth = image.width * coverScale;
      const drawHeight = image.height * coverScale;
      sampleContext.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
      const pixels = sampleContext.getImageData(0, 0, width, height).data;

      const homes: number[] = [];
      for (let index = 0; index < pixels.length; index += 16) {
        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];
        const alpha = pixels[index + 3];
        const luma = red * 0.2126 + green * 0.7152 + blue * 0.0722;
        if (alpha < 24 || luma < 16) continue;
        const pixel = index / 4;
        homes.push(pixel % width, Math.floor(pixel / width), red, green, blue);
      }
      if (homes.length === 0) return;

      const count = Math.min(particleCount, homes.length / 5);
      const homeCount = homes.length / 5;
      const x = new Float32Array(count);
      const y = new Float32Array(count);
      const vx = new Float32Array(count);
      const vy = new Float32Array(count);
      const life = new Float32Array(count);
      const home = new Uint32Array(count);

      const place = (index: number) => {
        const pick = Math.floor(Math.random() * homeCount);
        home[index] = pick;
        x[index] = homes[pick * 5];
        y[index] = homes[pick * 5 + 1];
        vx[index] = 0;
        vy[index] = 0;
        life[index] = Math.random() * lifespan;
      };
      for (let index = 0; index < count; index += 1) place(index);

      const buffer = context.createImageData(width, height);
      const words = new Uint32Array(buffer.data.buffer);
      const parsed = backgroundColor.replace("#", "");
      const backdrop =
        (255 << 24) |
        (Number.parseInt(parsed.slice(4, 6), 16) << 16) |
        (Number.parseInt(parsed.slice(2, 4), 16) << 8) |
        Number.parseInt(parsed.slice(0, 2), 16);
      let tick = 0;

      const render = () => {
        words.fill(backdrop);
        const time = tick * speed;
        const radius = cursorRadius * (width / (canvas.clientWidth || width));
        const radiusSq = radius * radius;
        for (let index = 0; index < count; index += 1) {
          const slot = home[index] * 5;
          const hx = homes[slot];
          const hy = homes[slot + 1];
          const angle = Math.sin(x[index] * noiseScale + time * 0.02) + Math.cos(y[index] * noiseScale - time * 0.016);
          vx[index] = vx[index] * damping + Math.cos(angle * Math.PI) * noiseStrength + (hx - x[index]) * 0.025;
          vy[index] = vy[index] * damping + Math.sin(angle * Math.PI) * noiseStrength + (hy - y[index]) * 0.025;
          if (pointer.active) {
            const dx = x[index] - pointer.x;
            const dy = y[index] - pointer.y;
            if (dx * dx + dy * dy < radiusSq) {
              vx[index] += pointer.vx * cursorStrength;
              vy[index] += pointer.vy * cursorStrength;
            }
          }
          x[index] += vx[index];
          y[index] += vy[index];
          life[index] -= 1;
          if (life[index] <= 0 || x[index] < 0 || y[index] < 0 || x[index] >= width || y[index] >= height) {
            place(index);
          }

          const px = x[index] | 0;
          const py = y[index] | 0;
          if (px < 0 || py < 0 || px >= width || py >= height) continue;
          const red = homes[slot + 2];
          const green = homes[slot + 3];
          const blue = homes[slot + 4];
          const alpha = Math.round(255 * particleOpacity);
          const offset = py * width + px;
          const previous = words[offset];
          const nextRed = Math.min(255, (previous & 255) + red);
          const nextGreen = Math.min(255, ((previous >> 8) & 255) + green);
          const nextBlue = Math.min(255, ((previous >> 16) & 255) + blue);
          words[offset] = (alpha << 24) | (nextBlue << 16) | (nextGreen << 8) | nextRed;
          if (particleSize > 1.4 && px + 1 < width) {
            words[offset + 1] = words[offset];
          }
        }
        context.putImageData(buffer, 0, 0);
        if (showImage) {
          context.globalAlpha = imageOpacity;
          context.drawImage(sample, 0, 0);
          context.globalAlpha = 1;
        }
        tick += 1;
      };

      render();
      const loop = () => {
        if (visible && !paused && !reduced) render();
        raf = requestAnimationFrame(loop);
      };
      if (!paused && !reduced) raf = requestAnimationFrame(loop);
    };

    const resizeObserver = new ResizeObserver(() => {
      if (!image.complete) return;
      cancelAnimationFrame(raf);
      start();
    });
    resizeObserver.observe(canvas);
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    visibility.observe(canvas);
    if (cursorInteraction) {
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerleave", onLeave);
    }
    image.onload = start;

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      visibility.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [
    backgroundColor,
    cursorInteraction,
    cursorRadius,
    cursorStrength,
    damping,
    dpr,
    imageOpacity,
    imageUrl,
    lifespan,
    noiseScale,
    noiseStrength,
    particleCount,
    particleOpacity,
    particleSize,
    paused,
    showImage,
    speed,
  ]);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
