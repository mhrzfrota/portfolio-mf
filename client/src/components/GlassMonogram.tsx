import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import {
  MONOGRAM_HEIGHT,
  MONOGRAM_SHAPES,
  MONOGRAM_WIDTH,
  outlineToPath,
} from "@/components/hero/monogramShape";
import {
  MONOGRAM_HALF_H,
  MONOGRAM_HALF_W,
  getMonogramField,
} from "@/lib/monogramField";

/**
 * Monograma MF em vidro fosco, raymarchado em WebGL puro (sem three.js).
 *
 * O que acontece por pixel: marcha até a face da frente da peça, refrata pra
 * dentro do vidro, marcha até a face de trás, refrata de novo pra fora e
 * reprojeta o raio de saída numa camada de luz atrás da peça. É refração de
 * verdade, com duas travessias — não é blur imitando vidro.
 *
 * A forma vem do MESMO contorno do monograma do hero, via campo de distância
 * pré-calculado ([[monogramField]]) — o polígono no shader seria caro demais.
 *
 * Fora da peça o pixel sai transparente: o céu da seção continua sendo CSS e
 * a camada de luz nunca aparece como fundo — só dentro do vidro.
 */

const CONFIG = {
  /**
   * Camada que o vidro refrata. Não é fundo: ela só existe DENTRO da peça —
   * fora dela o pixel sai transparente e o céu da seção continua limpo.
   * São luzes de estúdio, e é a refração delas que desenha o volume da marca.
   */
  light: {
    blobs: [
      { x: 0.28, y: 0.22, r: 0.8, color: "255,255,255", alpha: 0.85 },
      { x: 0.74, y: 0.74, r: 0.62, color: "196,222,255", alpha: 0.6 },
      { x: 0.62, y: 0.14, r: 0.24, color: "255,255,255", alpha: 0.95 },
      { x: 0.12, y: 0.82, r: 0.34, color: "150,190,255", alpha: 0.45 },
    ],
  },
  glass: {
    depth: 0.2, // meia-profundidade da extrusão
    round: 0.035, // raio do arredondamento das arestas
    ior: 1.46,
    frost: 0.055, // amplitude do ruído nas normais
    frostFreq: 11.0,
    blurBase: 0.008,
    blurFresnel: 0.05,
    chromaBase: 0.0035,
    chromaFresnel: 0.018,
    /** corpo do vidro: levemente azul, então ele ESCURECE o céu e ganha volume */
    body: 0.13,
    bodyColor: [0.5, 0.66, 0.98] as const,
    tint: [0.9, 0.94, 1.0] as const,
  },
  // foco longo (quase ortográfico): a marca ocupa o quadro sem a perspectiva
  // exagerada que entortaria as hastes do M
  camera: { z: 3.0, focal: 2.9, planeZ: -3.2 },
  grain: 0.022,
  rotation: {
    yaw: 0.34,
    pitch: 0.16,
    sway: 0.22, // vaivém do yaw parado (a peça é chapada: girar 360 some com ela)
    swaySpeed: 0.0032,
    bob: 0.07,
    bobSpeed: 0.0055,
    dragSpeed: 0.007,
    /** o arraste vertical é mais curto: é ele que ameaça tombar a peça */
    dragPitchSpeed: 0.003,
    damping: 0.94,
    /** volta pra pose de descanso depois do arraste; 0 desliga */
    homing: 0.02,
    /**
     * Limites absolutos, medidos a partir da marca de frente (não da pose de
     * descanso). Somados ao vaivém dão ~61° de guinada e ~19° de inclinação:
     * gira o bastante pra ler como 3D, nunca o bastante pra mostrar as costas
     * (que são o MF espelhado) nem pra deitar a peça.
     */
    yawClamp: 0.85,
    pitchClamp: 0.26,
  },
  maxDpr: 1.5,
};

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `#version 300 es
precision highp float;

uniform vec2  uRes;
uniform float uAspect;
uniform float uTime;
uniform highp sampler2D uTex;
// highp explícito: sampler2D nasce lowp em ES 3.00 e isso jogaria fora a
// precisão do campo de distância — a normal sairia em degraus.
uniform highp sampler2D uField;
uniform mat3  uInvRot;
uniform vec2  uFieldMin;
uniform vec2  uFieldSize;
uniform vec3  uHalfExtent;
uniform float uScale;
uniform float uDepth;
uniform float uRound;
uniform float uIOR;
uniform float uFrost;
uniform float uFrostFreq;
uniform float uBlurBase;
uniform float uBlurFresnel;
uniform float uChromaBase;
uniform float uChromaFresnel;
uniform float uBody;
uniform vec3  uBodyColor;
uniform vec3  uTint;
uniform float uCamZ;
uniform float uFocal;
uniform float uPlaneZ;
uniform float uGrain;

out vec4 fragColor;

/** SDF 2D da marca, lido do campo pré-calculado. */
float sdfMF(vec2 q) {
  vec2 t = (q - uFieldMin) / uFieldSize;
  return texture(uField, clamp(t, 0.0015, 0.9985)).r;
}

/** Extrusão arredondada do contorno 2D. */
float map(vec3 p) {
  vec3 q = (uInvRot * p) / uScale;
  float d2 = sdfMF(q.xy) + uRound;
  float dz = abs(q.z) - (uDepth - uRound);
  float d = min(max(d2, dz), 0.0) + length(max(vec2(d2, dz), 0.0)) - uRound;
  return d * uScale;
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(0.0012, 0.0);
  return normalize(vec3(
    map(p + e.xyy) - map(p - e.xyy),
    map(p + e.yxy) - map(p - e.yxy),
    map(p + e.yyx) - map(p - e.yyx)
  ));
}

/** Fatia do raio que atravessa a caixa da peça — fora dela nem vale marchar. */
vec2 boxSpan(vec3 ro, vec3 rd, vec3 b) {
  vec3 m = 1.0 / rd;
  vec3 n = m * ro;
  vec3 k = abs(m) * b;
  vec3 t1 = -n - k;
  vec3 t2 = -n + k;
  return vec2(max(max(t1.x, t1.y), t1.z), min(min(t2.x, t2.y), t2.z));
}

float hash31(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.11, 0.71, 0.31));
  p += dot(p, p.yzx + 19.19);
  return fract((p.x + p.y) * p.z);
}

float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash31(i + vec3(0.0, 0.0, 0.0)), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}

vec3 noise3(vec3 p) {
  return vec3(vnoise(p), vnoise(p + 37.21), vnoise(p + 71.53)) * 2.0 - 1.0;
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

/** Ponto do mundo -> uv, reprojetado pela MESMA câmera do raymarch. */
vec2 projectUV(vec3 h) {
  float s = max((uCamZ - h.z) / uFocal, 1e-4);
  vec2 pl = h.xy / s;
  return vec2(pl.x / uAspect, pl.y) * 0.5 + 0.5;
}

/** 16 taps em espiral de ângulo áureo + aberração cromática ao longo da refração. */
vec4 spiralSample(vec2 uv, float radius, vec2 caDir, float ca, float seed) {
  const float GOLDEN = 2.39996323;
  vec4 sum = vec4(0.0);
  for (int i = 0; i < 16; i++) {
    float fi = float(i) + seed;
    float a = fi * GOLDEN;
    float r = radius * sqrt(fi / 16.0);
    vec2 off = vec2(cos(a), sin(a)) * r * vec2(1.0 / uAspect, 1.0);
    vec2 base = uv + off;
    sum.r += texture(uTex, base + caDir * ca).r;
    vec4 mid = texture(uTex, base);
    sum.g += mid.g;
    sum.a += mid.a;
    sum.b += texture(uTex, base - caDir * ca).b;
  }
  return sum / 16.0;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= uAspect;

  vec3 ro = vec3(0.0, 0.0, uCamZ);
  vec3 rd = normalize(vec3(p, -uFocal));

  float seed = hash12(gl_FragCoord.xy + fract(uTime) * 91.7);

  vec4 col = vec4(0.0);

  vec2 span = boxSpan(uInvRot * ro, uInvRot * rd, uHalfExtent);

  if (span.x < span.y && span.y > 0.0) {
    float t = max(span.x, 0.0);
    bool hit = false;

    for (int i = 0; i < 64; i++) {
      float d = map(ro + rd * t);
      if (d < 0.0009) { hit = true; break; }
      t += d * 0.9;
      if (t > span.y) break;
    }

    if (hit) {
      vec3 pos = ro + rd * t;
      vec3 n = calcNormal(pos);
      n = normalize(n + noise3(pos * uFrostFreq) * uFrost);

      float fres = pow(clamp(1.0 - dot(-rd, n), 0.0, 1.0), 3.5);

      // entra no vidro
      vec3 rIn = refract(rd, n, 1.0 / uIOR);
      if (dot(rIn, rIn) < 0.001) rIn = reflect(rd, n);

      // atravessa o sólido marchando no SDF negado
      vec3 ip = pos + rIn * 0.012;
      for (int i = 0; i < 40; i++) {
        float d = -map(ip);
        if (d < 0.0009) break;
        ip += rIn * d * 0.9;
      }

      vec3 n2 = -calcNormal(ip);
      n2 = normalize(n2 + noise3(ip * uFrostFreq + 13.7) * uFrost);

      // sai (reflexão interna total cai no reflect) e bate no plano do fundo
      vec3 rOut = refract(rIn, n2, uIOR);
      if (dot(rOut, rOut) < 0.001) rOut = reflect(rIn, n2);

      vec2 rUV = uv;
      if (rOut.z < -1e-3) {
        float tp = (uPlaneZ - ip.z) / rOut.z;
        rUV = projectUV(ip + rOut * tp);
      }

      vec2 disp = rUV - uv;
      vec2 caDir = length(disp) > 1e-5 ? normalize(disp) : vec2(1.0, 0.0);

      vec4 refr = spiralSample(
        rUV,
        uBlurBase + uBlurFresnel * fres,
        caDir,
        uChromaBase + uChromaFresnel * fres,
        seed
      );

      float spec = pow(max(dot(reflect(rd, n), normalize(vec3(-0.55, 0.85, 0.55))), 0.0), 34.0) * 0.6;
      float rim = fres * 0.6;

      vec3 rgb = refr.rgb * uTint;
      float alpha = refr.a;

      // corpo do vidro: opaco o bastante pra escurecer o céu e virar volume
      rgb += uBodyColor * uBody;
      alpha += uBody;

      // borda, irisação roxa nos ângulos rasantes e um especular
      rgb += vec3(1.0) * rim;
      rgb += vec3(0.42, 0.32, 0.88) * pow(fres, 1.5) * 0.3;
      rgb += spec;
      alpha += rim * 0.9 + spec;
      col = vec4(rgb, clamp(alpha, 0.0, 1.0));
    }
  }

  // grão só onde há pixel: no transparente ele viraria sujeira sobre o céu
  col.rgb += (hash12(gl_FragCoord.xy + uTime) - 0.5) * 2.0 * uGrain * col.a;

  fragColor = col;
}
`;

/** Sem WebGL2 o canto não fica vazio: cai pro monograma chapado. */
function FlatMonogram({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`-0.4 -0.4 ${MONOGRAM_WIDTH + 0.8} ${MONOGRAM_HEIGHT + 0.8}`}
      className={cn("h-full w-full opacity-70", className)}
      aria-hidden="true"
    >
      <g fill="rgba(255,255,255,0.5)">
        {MONOGRAM_SHAPES.map((outline, index) => (
          <path key={index} d={outlineToPath(outline)} />
        ))}
      </g>
    </svg>
  );
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("GlassMonogram shader:", gl.getShaderInfoLog(shader));
  }
  return shader;
}

/**
 * Camada de luz: manchas suaves de estúdio, sem texto. É o que a refração
 * carrega pra dentro do vidro — quanto mais definida a mancha, mais o
 * "caustico" desenha a espessura da peça.
 */
function drawLightLayer(canvas: HTMLCanvasElement, w: number, h: number) {
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const reference = Math.max(w, h);

  for (const blob of CONFIG.light.blobs) {
    const cx = w * blob.x;
    const cy = h * blob.y;
    const radius = reference * blob.r;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, `rgba(${blob.color},${blob.alpha})`);
    gradient.addColorStop(0.55, `rgba(${blob.color},${blob.alpha * 0.28})`);
    gradient.addColorStop(1, `rgba(${blob.color},0)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }
}

/** mat3 (column-major) da rotação inversa: Rx(-pitch) * Ry(-yaw). */
function inverseRotation(yaw: number, pitch: number, out: Float32Array) {
  const cy = Math.cos(-yaw);
  const sy = Math.sin(-yaw);
  const cx = Math.cos(-pitch);
  const sx = Math.sin(-pitch);

  const ry = [cy, 0, -sy, 0, 1, 0, sy, 0, cy];
  const rx = [1, 0, 0, 0, cx, sx, 0, -sx, cx];

  for (let c = 0; c < 3; c++) {
    for (let r = 0; r < 3; r++) {
      out[c * 3 + r] =
        rx[r] * ry[c * 3] +
        rx[3 + r] * ry[c * 3 + 1] +
        rx[6 + r] * ry[c * 3 + 2];
    }
  }
  return out;
}

export default function GlassMonogram({ className }: { className?: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(false);

  // O campo de distância e o contexto WebGL só nascem quando a seção chega
  // perto da tela: a peça mora no rodapé e não pode custar nada na abertura.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || active) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setActive(true);
      },
      { rootMargin: "200px" }
    );

    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [active]);

  useEffect(() => {
    const node = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!active || !node || !wrapper) return;

    const context = node.getContext("webgl2", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      powerPreference: "high-performance",
    });

    if (!context) {
      setFailed(true);
      return;
    }

    // reamarrados já estreitados: o resto do efeito vive dentro de closures
    const canvas = node;
    const gl = context;

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("GlassMonogram link:", gl.getProgramInfoLog(program));
      setFailed(true);
      return;
    }
    gl.useProgram(program);

    // triângulo único cobrindo o canvas
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const uRes = u("uRes");
    const uAspect = u("uAspect");
    const uTime = u("uTime");
    const uInvRot = u("uInvRot");
    const uScale = u("uScale");
    const uHalfExtent = u("uHalfExtent");

    // campo de distância da marca (R16F pra normal não sair em degraus)
    const field = getMonogramField();
    const fieldTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, fieldTex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.R16F,
      field.width,
      field.height,
      0,
      gl.RED,
      gl.HALF_FLOAT,
      field.data
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // camada de luz refratada
    const lightCanvas = document.createElement("canvas");
    const lightTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, lightTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const { glass, camera } = CONFIG;
    gl.uniform1i(u("uTex"), 0);
    gl.uniform1i(u("uField"), 1);
    gl.uniform2f(u("uFieldMin"), field.min[0], field.min[1]);
    gl.uniform2f(u("uFieldSize"), field.size[0], field.size[1]);
    gl.uniform1f(u("uDepth"), glass.depth);
    gl.uniform1f(u("uRound"), glass.round);
    gl.uniform1f(u("uIOR"), glass.ior);
    gl.uniform1f(u("uFrost"), glass.frost);
    gl.uniform1f(u("uFrostFreq"), glass.frostFreq);
    gl.uniform1f(u("uBlurBase"), glass.blurBase);
    gl.uniform1f(u("uBlurFresnel"), glass.blurFresnel);
    gl.uniform1f(u("uChromaBase"), glass.chromaBase);
    gl.uniform1f(u("uChromaFresnel"), glass.chromaFresnel);
    gl.uniform1f(u("uBody"), glass.body);
    gl.uniform3f(
      u("uBodyColor"),
      glass.bodyColor[0],
      glass.bodyColor[1],
      glass.bodyColor[2]
    );
    gl.uniform3f(u("uTint"), glass.tint[0], glass.tint[1], glass.tint[2]);
    gl.uniform1f(u("uCamZ"), camera.z);
    gl.uniform1f(u("uFocal"), camera.focal);
    gl.uniform1f(u("uPlaneZ"), camera.planeZ);
    gl.uniform1f(u("uGrain"), CONFIG.grain);

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    let width = 0;
    let height = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDpr);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (w === width && h === height) return;

      width = w;
      height = h;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uAspect, w / h);

      // a peça encolhe em containers estreitos pra nunca encostar nas bordas
      const scale = Math.min(1, Math.max(0.5, (w / h) * 0.88));
      gl.uniform1f(uScale, scale);
      gl.uniform3f(
        uHalfExtent,
        (MONOGRAM_HALF_W + glass.round) * scale,
        (MONOGRAM_HALF_H + glass.round) * scale,
        (glass.depth + glass.round) * scale
      );

      drawLightLayer(lightCanvas, w, h);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, lightTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        lightCanvas
      );
    }

    const spin = {
      yaw: CONFIG.rotation.yaw,
      pitch: CONFIG.rotation.pitch,
      vYaw: 0,
      vPitch: 0,
      dragging: false,
      x: 0,
      y: 0,
    };

    const onPointerDown = (event: PointerEvent) => {
      spin.dragging = true;
      spin.vYaw = 0;
      spin.vPitch = 0;
      spin.x = event.clientX;
      spin.y = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!spin.dragging) return;
      const dx = (event.clientX - spin.x) * CONFIG.rotation.dragSpeed;
      const dy = (event.clientY - spin.y) * CONFIG.rotation.dragPitchSpeed;
      spin.x = event.clientX;
      spin.y = event.clientY;
      spin.yaw += dx;
      spin.pitch += dy;
      spin.vYaw = dx;
      spin.vPitch = dy;
    };

    const endDrag = (event: PointerEvent) => {
      if (!spin.dragging) return;
      spin.dragging = false;
      canvas.releasePointerCapture(event.pointerId);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);

    const rot = new Float32Array(9);
    let frame = 0;
    let raf = 0;
    let running = false;

    function draw() {
      const R = CONFIG.rotation;
      frame++;

      if (!spin.dragging) {
        spin.yaw += spin.vYaw;
        spin.pitch += spin.vPitch;
        spin.vYaw *= R.damping;
        spin.vPitch *= R.damping;

        // Quando a inércia acaba, a peça volta devagar pra pose de descanso —
        // quem gira e vai embora não deixa a marca torta.
        if (Math.abs(spin.vYaw) < 0.0015 && Math.abs(spin.vPitch) < 0.0015) {
          spin.yaw += (R.yaw - spin.yaw) * R.homing;
          spin.pitch += (R.pitch - spin.pitch) * R.homing;
        }
      }

      // Trava nos limites e mata a inércia que bate na parede — sem zerar a
      // velocidade a peça fica empurrando o limite depois de solta.
      const yaw0 = spin.yaw;
      const pitch0 = spin.pitch;
      spin.yaw = Math.max(-R.yawClamp, Math.min(R.yawClamp, spin.yaw));
      spin.pitch = Math.max(-R.pitchClamp, Math.min(R.pitchClamp, spin.pitch));
      if (spin.yaw !== yaw0) spin.vYaw = 0;
      if (spin.pitch !== pitch0) spin.vPitch = 0;

      const yaw =
        spin.yaw + (reduced ? 0 : Math.sin(frame * R.swaySpeed) * R.sway);
      const pitch =
        spin.pitch + (reduced ? 0 : Math.sin(frame * R.bobSpeed) * R.bob);

      gl.uniformMatrix3fv(uInvRot, false, inverseRotation(yaw, pitch, rot));
      gl.uniform1f(uTime, frame * 0.016);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function loop() {
      draw();
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (running) return;
      running = true;
      // com movimento reduzido a peça é um quadro só, sem loop
      if (reduced) {
        draw();
        running = false;
        return;
      }
      raf = requestAnimationFrame(loop);
    }

    function stop() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    }

    resize();

    const sizeObserver = new ResizeObserver(() => {
      resize();
      if (!running) draw();
    });
    sizeObserver.observe(canvas);

    // fora da tela o loop para: rolar a página deixa de custar GPU
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start();
      else stop();
    });
    observer.observe(wrapper);

    return () => {
      stop();
      observer.disconnect();
      sizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endDrag);
      canvas.removeEventListener("pointercancel", endDrag);
      gl.deleteTexture(fieldTex);
      gl.deleteTexture(lightTex);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, [active, reduced]);

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      {failed ? (
        <FlatMonogram />
      ) : (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-auto h-full w-full cursor-grab active:cursor-grabbing"
          style={{ touchAction: "pan-y" }}
        />
      )}
    </div>
  );
}
