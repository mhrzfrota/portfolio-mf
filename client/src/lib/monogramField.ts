/**
 * Campo de distância (SDF 2D) da marca MF, gerado uma vez em JS a partir dos
 * mesmos contornos que alimentam o monograma 3D do hero.
 *
 * Por que um campo e não o polígono direto no shader: o raymarch avalia a
 * forma umas 150x por pixel, e testar 58 segmentos a cada avaliação derrete
 * qualquer GPU. Amostrar uma textura é O(1) — o custo some.
 *
 * O campo é meio-float (R16F) porque 8 bits quantizam a distância a ponto de
 * a normal por diferenças centrais sair em degraus visíveis no vidro.
 */

import {
  MONOGRAM_HEIGHT,
  MONOGRAM_SHAPES,
  MONOGRAM_WIDTH,
} from "@/components/hero/monogramShape";

/** Largura da marca em unidades de mundo (a altura acompanha a proporção). */
const WORLD_WIDTH = 2.1;
const SCALE = WORLD_WIDTH / MONOGRAM_WIDTH;

/** Meia-extensão da marca já em mundo — vira a AABB do raymarch. */
export const MONOGRAM_HALF_W = (MONOGRAM_WIDTH * SCALE) / 2;
export const MONOGRAM_HALF_H = (MONOGRAM_HEIGHT * SCALE) / 2;

const FIELD_W = 384;
const FIELD_H = 240;
/** Folga ao redor da marca: o marcher precisa de distância válida fora dela. */
const DOMAIN_HALF_X = 1.35;
const DOMAIN_HALF_Y = (DOMAIN_HALF_X * FIELD_H) / FIELD_W;

export type MonogramField = {
  data: Uint16Array;
  width: number;
  height: number;
  /** Canto inferior-esquerdo do domínio, em mundo. */
  min: [number, number];
  /** Tamanho do domínio, em mundo. */
  size: [number, number];
};

const f32 = new Float32Array(1);
const i32 = new Int32Array(f32.buffer);

/** float32 -> half float (bits), o formato que o texImage2D com HALF_FLOAT quer. */
function toHalf(value: number): number {
  f32[0] = value;
  const x = i32[0];
  let bits = (x >> 16) & 0x8000;
  let mantissa = (x >> 12) & 0x07ff;
  const exponent = (x >> 23) & 0xff;

  if (exponent < 103) return bits;
  if (exponent > 142) return bits | 0x7c00;
  if (exponent < 113) {
    mantissa |= 0x0800;
    return (
      bits |
      ((mantissa >> (114 - exponent)) + ((mantissa >> (113 - exponent)) & 1))
    );
  }

  bits |= ((exponent - 112) << 10) | (mantissa >> 1);
  return bits + (mantissa & 1);
}

/** Segmentos [x0,y0,x1,y1] das três peças, já em coordenadas de mundo. */
function buildSegments(): Float32Array {
  const segments: number[] = [];

  for (const outline of MONOGRAM_SHAPES) {
    for (let i = 0; i < outline.length; i++) {
      const a = outline[i];
      const b = outline[(i + 1) % outline.length];
      segments.push(
        (a[0] - MONOGRAM_WIDTH / 2) * SCALE,
        (a[1] - MONOGRAM_HEIGHT / 2) * SCALE,
        (b[0] - MONOGRAM_WIDTH / 2) * SCALE,
        (b[1] - MONOGRAM_HEIGHT / 2) * SCALE
      );
    }
  }

  return new Float32Array(segments);
}

let cached: MonogramField | null = null;

export function getMonogramField(): MonogramField {
  if (cached) return cached;

  const segments = buildSegments();
  const count = segments.length / 4;
  const data = new Uint16Array(FIELD_W * FIELD_H);

  const stepX = (DOMAIN_HALF_X * 2) / FIELD_W;
  const stepY = (DOMAIN_HALF_Y * 2) / FIELD_H;

  for (let iy = 0; iy < FIELD_H; iy++) {
    const py = -DOMAIN_HALF_Y + (iy + 0.5) * stepY;

    for (let ix = 0; ix < FIELD_W; ix++) {
      const px = -DOMAIN_HALF_X + (ix + 0.5) * stepX;

      let best = Infinity;
      let inside = false;

      for (let s = 0; s < count; s++) {
        const ax = segments[s * 4];
        const ay = segments[s * 4 + 1];
        const bx = segments[s * 4 + 2];
        const by = segments[s * 4 + 3];

        const ex = bx - ax;
        const ey = by - ay;
        const wx = px - ax;
        const wy = py - ay;
        const t = Math.max(
          0,
          Math.min(1, (wx * ex + wy * ey) / (ex * ex + ey * ey || 1e-12))
        );
        const dx = wx - ex * t;
        const dy = wy - ey * t;
        const d2 = dx * dx + dy * dy;
        if (d2 < best) best = d2;

        // par/ímpar: as peças não se sobrepõem, então isso já é a união
        if (
          ay > py !== by > py &&
          px < ((bx - ax) * (py - ay)) / (by - ay) + ax
        ) {
          inside = !inside;
        }
      }

      const distance = Math.sqrt(best);
      data[iy * FIELD_W + ix] = toHalf(inside ? -distance : distance);
    }
  }

  cached = {
    data,
    width: FIELD_W,
    height: FIELD_H,
    min: [-DOMAIN_HALF_X, -DOMAIN_HALF_Y],
    size: [DOMAIN_HALF_X * 2, DOMAIN_HALF_Y * 2],
  };

  return cached;
}
