import { readFileSync } from "node:fs";
export type Esquema = {
  type?: string | string[];
  properties?: Record<string, Esquema>;
  required?: string[];
  additionalProperties?: boolean;
  items?: Esquema;
  enum?: unknown[];
};
export function erroEsquema(
  v: unknown,
  s: Esquema,
  campo = "saida"
): string | null {
  const tipo = v === null ? "null" : Array.isArray(v) ? "array" : typeof v;
  if (s.type && !(Array.isArray(s.type) ? s.type : [s.type]).includes(tipo))
    return campo;
  if (s.enum && !s.enum.includes(v)) return campo;
  if (tipo === "array" && s.items) {
    for (const [i, item] of (v as unknown[]).entries()) {
      const erro = erroEsquema(item, s.items, `${campo}[${i}]`);
      if (erro) return erro;
    }
  }
  if (tipo === "object") {
    const o = v as Record<string, unknown>;
    for (const k of s.required ?? [])
      if (!Object.hasOwn(o, k)) return `${campo}.${k}`;
    for (const [k, valor] of Object.entries(o)) {
      if (s.properties?.[k]) {
        const erro = erroEsquema(valor, s.properties[k], `${campo}.${k}`);
        if (erro) return erro;
      } else if (s.additionalProperties === false) return `${campo}.${k}`;
    }
  }
  return null;
}
export const esquemaCodex: Esquema = JSON.parse(
  readFileSync(new URL("./esquemas/codex.json", import.meta.url), "utf8")
);
export const esquemaClaude: Esquema = JSON.parse(
  readFileSync(new URL("./esquemas/claude.json", import.meta.url), "utf8")
);
