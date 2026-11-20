import { useEffect, useRef } from "react";

type ThinkingDotsProps = {
  className?: string;
  speed?: number;
  lobes?: number;
  spacing?: number;
  dotSize?: number;
  dotGain?: number;
  dotSoftness?: number;
  jitter?: number;
  pulse?: number;
  pulseRate?: number;
  pulseGlow?: number;
  drift?: number;
  cloudScale?: number;
  turbulence?: number;
  turbulenceScale?: number;
  ambient?: number;
  intensity?: number;
  accentStart?: number;
  accentEnd?: number;
  color?: string;
  accentColor?: string;
  glow?: number;
  glowFalloff?: number;
  grain?: number;
  vignette?: number;
  backgroundColor?: string;
  opacity?: number;
  cursorInteraction?: boolean;
  cursorInfluence?: number;
  paused?: boolean;
  dpr?: number;
};

type Rgb = { r: number; g: number; b: number };

function parseHex(hex: string): Rgb {
  const value = hex.replace("#", "");
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** 点阵被一团缓慢漂移的云托起，对应 Thinking Dots 的背景。 */
export default function ThinkingDots({
  className,
  speed = 1,
  lobes = 3,
  spacing = 0.02,
  dotSize = 0.045,
  dotGain = 0.16,
  dotSoftness = 0.48,
  jitter = 0.01,
  pulse = 0.1,
  pulseRate = 1.6,
  pulseGlow = 0.22,
  drift = 0.22,
  cloudScale = 0.85,
  turbulence = 0.22,
  turbulenceScale = 2.4,
  ambient = 0.42,
  intensity = 1,
  accentStart = 0.55,
  accentEnd = 1.1,
  color = "#146b48",
  accentColor = "#5dffc3",
  glow = 0.035,
  glowFalloff = 4,
  grain = 0.03,
  vignette = 0.45,
  backgroundColor = "#000000",
  opacity = 1,
  cursorInteraction = true,
  cursorInfluence = 0.35,
  paused = false,
  dpr = 1.5,
}: ThinkingDotsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const base = parseHex(color);
    const accent = parseHex(accentColor);
    const pointer = { x: 0.5, y: 0.5, active: false };
    let frame = 0;
    let visible = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(dpr, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    visibility.observe(canvas);

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / rect.width;
      pointer.y = (event.clientY - rect.top) / rect.height;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
    };
    if (cursorInteraction) {
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerleave", onLeave);
    }

    const draw = (time: number) => {
      const width = canvas.width;
      const height = canvas.height;
      context.clearRect(0, 0, width, height);
      context.globalAlpha = opacity;
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, width, height);

      const cell = Math.max(4, height * spacing);
      const cols = Math.ceil(width / cell);
      const rows = Math.ceil(height / cell);
      const seconds = time / 1000;
      const lobeCenters = Array.from({ length: lobes }, (_, index) => {
        const phase = (index / lobes) * Math.PI * 2;
        let x = 0.5 + Math.sin(seconds * speed * 0.35 + phase) * drift;
        let y = 0.5 + Math.cos(seconds * speed * 0.28 + phase * 1.3) * drift * 0.72;
        if (cursorInteraction && pointer.active) {
          x = mix(x, pointer.x, cursorInfluence);
          y = mix(y, pointer.y, cursorInfluence);
        }
        return { x, y };
      });

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const nx = (col + 0.5) / cols;
          const ny = (row + 0.5) / rows;
          let density = 0;
          for (const lobe of lobeCenters) {
            const dx = (nx - lobe.x) / cloudScale;
            const dy = (ny - lobe.y) / (cloudScale * 0.72);
            density += Math.exp(-(dx * dx + dy * dy) * 7.5);
          }
          const wobble = Math.sin(nx * turbulenceScale * 6 + seconds) * Math.cos(ny * turbulenceScale * 5 - seconds * 0.8);
          density = Math.max(0, density + wobble * turbulence);
          const edge = Math.hypot(nx - 0.5, ny - 0.5);
          density *= 1 - Math.min(1, edge * vignette * 1.6);
          const ripple = Math.sin(nx * 8 + ny * 5 - seconds * pulseRate) * pulse;
          const bright = Math.min(1, ambient + density * intensity + Math.max(0, ripple) * pulseGlow);
          const accentT = Math.min(1, Math.max(0, (density - accentStart) / (accentEnd - accentStart)));
          const jitterSeed = Math.sin(col * 12.9898 + row * 78.233) * 43758.5453;
          const jitterAmount = (jitterSeed - Math.floor(jitterSeed) - 0.5) * jitter;
          const radius = cell * (dotSize + density * dotGain + jitterAmount + ripple * 0.04) * (0.7 + dotSoftness);
          if (radius < 0.3 || bright < 0.02) continue;

          const red = Math.round(mix(base.r, accent.r, accentT));
          const green = Math.round(mix(base.g, accent.g, accentT));
          const blue = Math.round(mix(base.b, accent.b, accentT));
          context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${Math.min(1, bright)})`;
          context.beginPath();
          context.arc((col + 0.5) * cell, (row + 0.5) * cell, Math.max(0.4, radius), 0, Math.PI * 2);
          context.fill();

          if (glow > 0 && density > accentStart) {
            context.fillStyle = `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${density * glow})`;
            context.beginPath();
            context.arc((col + 0.5) * cell, (row + 0.5) * cell, radius * glowFalloff * 0.45, 0, Math.PI * 2);
            context.fill();
          }
        }
      }

      if (grain > 0) {
        const speckles = Math.round((width * height) / 9000);
        context.fillStyle = `rgba(255, 255, 255, ${grain})`;
        for (let index = 0; index < speckles; index += 1) {
          const seed = Math.sin(index * 91.7 + seconds * 24) * 10000;
          const unit = seed - Math.floor(seed);
          context.fillRect(unit * width, ((seed * 13) % 1) * height, 1, 1);
        }
      }
    };

    let raf = 0;
    const loop = (time: number) => {
      frame = time;
      if (visible && !paused && !reduced) draw(time);
      raf = requestAnimationFrame(loop);
    };
    draw(0);
    if (!paused && !reduced) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      visibility.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      void frame;
    };
  }, [
    accentColor,
    accentEnd,
    accentStart,
    ambient,
    backgroundColor,
    cloudScale,
    color,
    cursorInfluence,
    cursorInteraction,
    dotGain,
    dotSize,
    dotSoftness,
    dpr,
    drift,
    glow,
    glowFalloff,
    grain,
    intensity,
    jitter,
    lobes,
    opacity,
    paused,
    pulse,
    pulseGlow,
    pulseRate,
    spacing,
    speed,
    turbulence,
    turbulenceScale,
    vignette,
  ]);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
