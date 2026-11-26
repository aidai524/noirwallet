/**
 * 页面最底部雕像的粒子效果（自己实现，机制和参数照 ReactBits 的 Particle Image）。
 * - 原图照常显示在下面（Image Opacity 1）；画布上铺满几十万个粒子，每个带着出生位置的图像亮度。
 * - 粒子沿一个缓慢变化的噪声流场游走，按寿命淡入淡出，寿命到了在随机位置重生：图像表面一直有一层流动的颗粒。
 * - 鼠标划过时，把鼠标的速度按比例传给附近的粒子：粒子被拖着走，暗的粒子盖到亮处，雕像像被抹开；
 *   被拖走的粒子寿命到了就在原图上重生，画面慢慢复原。触屏上点一下会从手指处炸开。
 * 粒子状态放在 GPU 上逐帧更新（WebGL2 transform feedback），CPU 只传鼠标；页脚不在视口里时停掉。
 */

type Options = {
  /** 雕像容器，画布和它一样大。 */
  box: HTMLElement;
  /** 页面里的雕像图：取它的地址和 object-position，让粒子和图片对齐。 */
  img: HTMLImageElement;
  canvas: HTMLCanvasElement;
  /** 接收指针的区域。用整个页脚，鼠标在压着雕像的版权文字和大字标上也能拨到粒子。 */
  hitArea: HTMLElement;
  onReady: () => void;
  onFail: () => void;
};

/** 参数名和取值照 ReactBits Particle Image 的 Customize 面板（默认值）。 */
export const PARTICLE_PARAMS = {
  /** 它的演示画布约 631 × 560 时 50 万个；这里按面积换算成同样的密度，再封顶（见 countFor）。 */
  particleCount: 500_000,
  /** 粒子直径（CSS px）。 */
  particleSize: 2,
  /** 粒子最亮时的不透明度。 */
  particleOpacity: 0.85,
  /** 流场随时间变化的快慢。 */
  speed: 1,
  /** 流场的空间频率：越小水流越长越顺。 */
  noiseScale: 0.0005,
  /** 每帧沿流场的加速度（px / 帧²）。 */
  noiseStrength: 0.05,
  /** 每帧保留的速度。 */
  damping: 0.95,
  /** 粒子活多少帧后重生。 */
  lifespan: 200,
  /** 下面原图的不透明度（CSS 控制，见 .statue img）。 */
  imageOpacity: 1,
  /** 鼠标速度有多少传给附近的粒子。 */
  cursorStrength: 0.1,
  /** 鼠标影响半径（CSS px）。 */
  cursorRadius: 100,
} as const;

const REFERENCE_AREA = 631 * 560;
const MIN_PARTICLES = 60_000;
const MAX_PARTICLES = 500_000;
/** 流场在时间维度上每秒前进多少（再乘 speed）。 */
const FLOW_RATE = 1;
/**
 * ReactBits 的 noiseStrength 和这里按像素算的位移单位不同：0.05 直接当 px/帧² 用，
 * 粒子一生要顺着流场飘 ~180px，静止时雕像会被暗粒子抹花。乘上这个系数后一生大约飘 20px，
 * 和它演示里静止时「图像清楚、边缘有细尘被风带走」的样子一致。鼠标拖拽不受影响。
 */
const DRIFT = 0.12;
/** 单帧鼠标位移上限，猛甩时不至于把粒子甩出画面。 */
const MAX_MOVE = 60;
/** 触屏点一下的爆开力度（px / 帧）。 */
const BURST = 6;
/** 鼠标拖动时粒子往两侧散开的程度（相对拖动方向），让拖出来的不是一缕缕拉丝，而是散开的尘。 */
const SPREAD = 0.9;

/** 每个粒子 6 个数：位置 x、y，速度 x、y，年龄（帧），亮度。 */
const STRIDE = 6;

const UPDATE_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
layout(location = 1) in vec2 aVel;
layout(location = 2) in float aAge;
layout(location = 3) in float aShade;
uniform sampler2D uImage;
uniform vec2 uSize;
uniform float uTime;
uniform float uSeed;
uniform float uNoiseScale;
uniform float uNoiseStrength;
uniform float uDamping;
uniform float uLife;
uniform vec4 uSeg;
uniform float uPush;
uniform float uRadius;
uniform vec3 uBurst;
uniform float uSpread;
out vec2 vPos;
out vec2 vVel;
out float vAge;
out float vShade;

float hash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1.0, 0.0, 0.0)), u.x), mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), u.x), u.y),
    mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), u.x), mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), u.x), u.y),
    u.z);
}

void main() {
  vec2 pos = aPos;
  vec2 vel = aVel;
  float age = aAge + 1.0;
  float shade = aShade;
  float id = float(gl_VertexID);
  if (age >= uLife) {
    vec2 r = vec2(hash(vec3(id * 0.0173, uSeed, 1.7)), hash(vec3(id * 0.0291, uSeed, 9.3)));
    pos = r * uSize;
    vel = vec2(0.0);
    age = 0.0;
    shade = texture(uImage, r).r;
  }
  float angle = noise(vec3(pos * uNoiseScale, uTime)) * 12.5664;
  vel += vec2(cos(angle), sin(angle)) * uNoiseStrength;
  if (uPush > 0.0) {
    vec2 ab = uSeg.zw - uSeg.xy;
    float t = clamp(dot(pos - uSeg.xy, ab) / max(dot(ab, ab), 0.0001), 0.0, 1.0);
    float d = distance(pos, uSeg.xy + ab * t);
    if (d < uRadius) {
      float k = 1.0 - d / uRadius;
      // 每个粒子反应不一样：顺着拖动方向的力 0.5–1.5 倍，再往两侧偏一点，拖出来的是散开的尘
      float along = 0.5 + hash(vec3(id * 0.0137, 3.1, 7.7));
      float across = hash(vec3(id * 0.0219, 5.3, 1.9)) - 0.5;
      vel += (ab * along + vec2(-ab.y, ab.x) * across * uSpread) * uPush * k * k;
    }
  }
  if (uBurst.z > 0.0) {
    vec2 away = pos - uBurst.xy;
    float d = length(away);
    float reach = uRadius * 1.2;
    if (d < reach && d > 0.001) {
      // 力度和方向都带点随机，炸开的是一团尘，不是一圈整齐的环
      vec2 dir = away / d;
      dir = normalize(dir + vec2(-dir.y, dir.x) * (hash(vec3(id * 0.0171, 1.1, 6.1)) - 0.5) * 1.4);
      vel += dir * uBurst.z * (1.0 - d / reach) * (0.2 + hash(vec3(id * 0.0113, 8.3, 2.9)));
    }
  }
  vel *= uDamping;
  pos += vel;
  vPos = pos;
  vVel = vel;
  vAge = age;
  vShade = shade;
}`;

const UPDATE_FS = `#version 300 es
precision mediump float;
out vec4 outColor;
void main() {
  outColor = vec4(0.0);
}`;

const RENDER_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
layout(location = 2) in float aAge;
layout(location = 3) in float aShade;
uniform vec2 uSize;
uniform float uLife;
uniform float uOpacity;
uniform float uPointSize;
out float vAlpha;
out float vShade;
void main() {
  float t = aAge / uLife;
  vAlpha = uOpacity * smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.85, 1.0, t));
  vShade = aShade;
  vec2 clip = aPos / uSize * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = uPointSize;
}`;

const RENDER_FS = `#version 300 es
precision mediump float;
in float vAlpha;
in float vShade;
out vec4 outColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  if (dot(c, c) > 0.25) discard;
  outColor = vec4(vec3(vShade) * vAlpha, vAlpha);
}`;

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function link(gl: WebGL2RenderingContext, vs: string, fs: string, varyings?: string[]) {
  const vertex = compile(gl, gl.VERTEX_SHADER, vs);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fs);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  if (varyings) gl.transformFeedbackVaryings(program, varyings, gl.INTERLEAVED_ATTRIBS);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  gl.deleteProgram(program);
  return null;
}

/** object-position 的一个分量换成像素偏移（free = 容器尺寸 − 图片铺满后的尺寸）。 */
function offset(value: string | undefined, free: number) {
  if (value?.endsWith("%")) return (free * parseFloat(value)) / 100;
  if (value?.endsWith("px")) return parseFloat(value);
  return free / 2;
}

/** 按 object-fit: cover 把图铺进 width × height 的画布，和页面上的 <img> 对齐。 */
function coverCanvas(source: HTMLImageElement, img: HTMLImageElement, width: number, height: number) {
  const scratch = document.createElement("canvas");
  scratch.width = width;
  scratch.height = height;
  const ctx = scratch.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  const scale = Math.max(width / source.naturalWidth, height / source.naturalHeight);
  const drawW = source.naturalWidth * scale;
  const drawH = source.naturalHeight * scale;
  const [posX, posY] = getComputedStyle(img).objectPosition.split(" ");
  ctx.drawImage(source, offset(posX, width - drawW), offset(posY, height - drawH), drawW, drawH);
  return { canvas: scratch, pixels: ctx.getImageData(0, 0, width, height).data };
}

/** 按面积换算成和 ReactBits 演示一样的密度，再限制在合理范围。 */
function countFor(width: number, height: number) {
  const scaled = (PARTICLE_PARAMS.particleCount * width * height) / REFERENCE_AREA;
  return Math.round(Math.min(MAX_PARTICLES, Math.max(MIN_PARTICLES, scaled)));
}

type Sim = {
  width: number;
  height: number;
  count: number;
  buffers: [WebGLBuffer, WebGLBuffer];
  updateVaos: [WebGLVertexArrayObject, WebGLVertexArrayObject];
  renderVaos: [WebGLVertexArrayObject, WebGLVertexArrayObject];
  texture: WebGLTexture;
  /** 当前存着最新状态的是哪一个缓冲区。 */
  current: 0 | 1;
};

export function createParticleImage({ box, img, canvas, hitArea, onReady, onFail }: Options): () => void {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
  });
  const update = gl && link(gl, UPDATE_VS, UPDATE_FS, ["vPos", "vVel", "vAge", "vShade"]);
  const render = gl && link(gl, RENDER_VS, RENDER_FS);
  const feedback = gl?.createTransformFeedback();
  if (!gl || !update || !render || !feedback) {
    onFail();
    return () => {};
  }

  const u = (program: WebGLProgram, name: string) => gl.getUniformLocation(program, name);
  const up = {
    image: u(update, "uImage"),
    size: u(update, "uSize"),
    time: u(update, "uTime"),
    seed: u(update, "uSeed"),
    noiseScale: u(update, "uNoiseScale"),
    noiseStrength: u(update, "uNoiseStrength"),
    damping: u(update, "uDamping"),
    life: u(update, "uLife"),
    seg: u(update, "uSeg"),
    push: u(update, "uPush"),
    radius: u(update, "uRadius"),
    burst: u(update, "uBurst"),
    spread: u(update, "uSpread"),
  };
  const rp = {
    size: u(render, "uSize"),
    life: u(render, "uLife"),
    opacity: u(render, "uOpacity"),
    pointSize: u(render, "uPointSize"),
  };

  gl.useProgram(update);
  gl.uniform1f(up.noiseScale, PARTICLE_PARAMS.noiseScale);
  gl.uniform1f(up.noiseStrength, PARTICLE_PARAMS.noiseStrength * DRIFT);
  gl.uniform1f(up.damping, PARTICLE_PARAMS.damping);
  gl.uniform1f(up.life, PARTICLE_PARAMS.lifespan);
  gl.uniform1f(up.radius, PARTICLE_PARAMS.cursorRadius);
  gl.uniform1f(up.spread, SPREAD);
  gl.uniform1i(up.image, 0);
  gl.useProgram(render);
  gl.uniform1f(rp.life, PARTICLE_PARAMS.lifespan);
  gl.uniform1f(rp.opacity, PARTICLE_PARAMS.particleOpacity);
  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  let sim: Sim | null = null;
  let source: HTMLImageElement | null = null;
  let raf = 0;
  let frameNo = 0;
  let dead = false;
  let resizeTimer = 0;
  const start = performance.now();
  const pointer = { x: 0, y: 0, lastX: 0, lastY: 0, clientX: 0, clientY: 0, inside: false, moved: false };
  let burst: { x: number; y: number } | null = null;

  const freeSim = (old: Sim) => {
    old.buffers.forEach((buffer) => gl.deleteBuffer(buffer));
    old.updateVaos.forEach((vao) => gl.deleteVertexArray(vao));
    old.renderVaos.forEach((vao) => gl.deleteVertexArray(vao));
    gl.deleteTexture(old.texture);
  };

  /** 按当前尺寸建粒子：均匀撒满画布，年龄错开，亮度取自原图。尺寸没变就什么都不做。 */
  const layout = () => {
    if (!source) return false;
    const rect = box.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    if (!width || !height) return false;
    if (sim && sim.width === width && sim.height === height) return true;
    const cover = coverCanvas(source, img, width, height);
    if (!cover) return false;

    const count = countFor(width, height);
    const data = new Float32Array(count * STRIDE);
    for (let i = 0; i < count; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const o = i * STRIDE;
      data[o] = x;
      data[o + 1] = y;
      data[o + 4] = Math.random() * PARTICLE_PARAMS.lifespan;
      data[o + 5] = cover.pixels[(Math.floor(y) * width + Math.floor(x)) * 4] / 255;
    }

    const texture = gl.createTexture();
    const a = gl.createBuffer();
    const b = gl.createBuffer();
    const vaos = [gl.createVertexArray(), gl.createVertexArray(), gl.createVertexArray(), gl.createVertexArray()];
    if (!texture || !a || !b || vaos.some((vao) => !vao)) return false;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cover.canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const bytes = STRIDE * 4;
    const describe = (vao: WebGLVertexArrayObject, buffer: WebGLBuffer, forUpdate: boolean) => {
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, bytes, 0);
      if (forUpdate) {
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, bytes, 8);
      }
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 1, gl.FLOAT, false, bytes, 16);
      gl.enableVertexAttribArray(3);
      gl.vertexAttribPointer(3, 1, gl.FLOAT, false, bytes, 20);
    };
    gl.bindBuffer(gl.ARRAY_BUFFER, a);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_COPY);
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_COPY);
    const [ua, ub, ra, rb] = vaos as WebGLVertexArrayObject[];
    describe(ua, a, true);
    describe(ub, b, true);
    describe(ra, a, false);
    describe(rb, b, false);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    gl.useProgram(update);
    gl.uniform2f(up.size, width, height);
    gl.useProgram(render);
    gl.uniform2f(rp.size, width, height);
    gl.uniform1f(rp.pointSize, PARTICLE_PARAMS.particleSize * dpr);

    if (sim) freeSim(sim);
    sim = { width, height, count, buffers: [a, b], updateVaos: [ua, ub], renderVaos: [ra, rb], texture, current: 0 };
    return true;
  };

  /** 走一帧：读当前缓冲区，把新状态写进另一个（transform feedback）。 */
  const step = (now: number) => {
    if (!sim) return;
    const from = sim.current;
    const to = from === 0 ? 1 : 0;

    let push = 0;
    const seg = [pointer.lastX, pointer.lastY, pointer.x, pointer.y];
    if (pointer.inside && pointer.moved) {
      let dx = pointer.x - pointer.lastX;
      let dy = pointer.y - pointer.lastY;
      const length = Math.hypot(dx, dy);
      if (length > MAX_MOVE) {
        dx *= MAX_MOVE / length;
        dy *= MAX_MOVE / length;
        seg[0] = pointer.x - dx;
        seg[1] = pointer.y - dy;
      }
      push = length > 0.3 ? PARTICLE_PARAMS.cursorStrength : 0;
      pointer.lastX = pointer.x;
      pointer.lastY = pointer.y;
      pointer.moved = false;
    }

    gl.useProgram(update);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sim.texture);
    gl.uniform1f(up.time, ((now - start) / 1000) * PARTICLE_PARAMS.speed * FLOW_RATE);
    gl.uniform1f(up.seed, (frameNo * 0.6180339887) % 1000);
    gl.uniform4f(up.seg, seg[0], seg[1], seg[2], seg[3]);
    gl.uniform1f(up.push, push);
    gl.uniform3f(up.burst, burst?.x ?? 0, burst?.y ?? 0, burst ? BURST : 0);
    burst = null;
    gl.bindVertexArray(sim.updateVaos[from]);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, feedback);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, sim.buffers[to]);
    gl.enable(gl.RASTERIZER_DISCARD);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, sim.count);
    gl.endTransformFeedback();
    gl.disable(gl.RASTERIZER_DISCARD);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    gl.bindVertexArray(null);
    sim.current = to;
    frameNo += 1;
  };

  const draw = () => {
    if (!sim) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(render);
    gl.bindVertexArray(sim.renderVaos[sim.current]);
    gl.drawArrays(gl.POINTS, 0, sim.count);
    gl.bindVertexArray(null);
  };

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    step(now);
    draw();
  };

  const run = (on: boolean) => {
    if (on && !raf && sim) raf = requestAnimationFrame(frame);
    if (!on && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  const local = (event: PointerEvent) => {
    const rect = box.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top] as const;
  };
  const onMove = (event: PointerEvent) => {
    const [x, y] = local(event);
    // 页面滚动时浏览器会补发 pointermove：指针在屏幕上没动，只是内容动了。这种只重定起点，不算拨动。
    const still = pointer.inside && event.clientX === pointer.clientX && event.clientY === pointer.clientY;
    pointer.clientX = event.clientX;
    pointer.clientY = event.clientY;
    pointer.x = x;
    pointer.y = y;
    if (!pointer.inside || still) {
      pointer.inside = true;
      pointer.lastX = x;
      pointer.lastY = y;
      pointer.moved = false;
      return;
    }
    pointer.moved = true;
  };
  const onLeave = () => {
    pointer.inside = false;
    pointer.moved = false;
  };
  const onDown = (event: PointerEvent) => {
    if (event.pointerType === "mouse") return;
    const [x, y] = local(event);
    burst = { x, y };
  };

  const viewport = new IntersectionObserver(([entry]) => run(entry.isIntersecting));
  const resize = new ResizeObserver(() => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (!dead && !layout()) fail();
    }, 150);
  });

  const cleanup = () => {
    dead = true;
    run(false);
    window.clearTimeout(resizeTimer);
    viewport.disconnect();
    resize.disconnect();
    hitArea.removeEventListener("pointermove", onMove);
    hitArea.removeEventListener("pointerleave", onLeave);
    hitArea.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("webglcontextlost", onLost);
    if (!gl.isContextLost()) {
      if (sim) freeSim(sim);
      gl.deleteTransformFeedback(feedback);
      gl.deleteProgram(update);
      gl.deleteProgram(render);
    }
    sim = null;
  };
  const fail = () => {
    if (dead) return;
    cleanup();
    onFail();
  };
  const onLost = (event: Event) => {
    event.preventDefault();
    fail();
  };

  canvas.addEventListener("webglcontextlost", onLost);
  const image = new Image();
  image.decoding = "async";
  image.src = img.currentSrc || img.src;
  image.decode().then(
    () => {
      if (dead) return;
      source = image;
      if (!layout()) {
        fail();
        return;
      }
      draw();
      hitArea.addEventListener("pointermove", onMove, { passive: true });
      hitArea.addEventListener("pointerleave", onLeave);
      hitArea.addEventListener("pointerdown", onDown, { passive: true });
      viewport.observe(box);
      resize.observe(box);
      onReady();
    },
    () => fail(),
  );

  return () => {
    if (!dead) cleanup();
  };
}
