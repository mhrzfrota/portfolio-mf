import {
  mkdirSync,
  openSync,
  closeSync,
  writeFileSync,
  readFileSync,
  statSync,
  unlinkSync,
  readdirSync,
  rmSync,
  renameSync,
  lstatSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";
import { validarDia } from "./tempo.ts";
export const pastaBase = () =>
  resolve(process.env.NOITE_DIR ?? join(homedir(), ".local/share/noite-mf"));
export function gravarJson(p: string, v: unknown): void {
  const temp = `${p}.${process.pid}.tmp`;
  writeFileSync(temp, JSON.stringify(v, null, 2) + "\n", { mode: 0o600 });
  renameSync(temp, p);
}
export function travar(base: string, agora = Date.now()): () => void {
  mkdirSync(base, { recursive: true, mode: 0o700 });
  const p = join(base, "noite.lock");
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    try {
      const fd = openSync(p, "wx", 0o600);
      writeFileSync(fd, String(process.pid));
      closeSync(fd);
      const identidade = statSync(p);
      return () => {
        try {
          const atual = statSync(p);
          if (
            atual.ino === identidade.ino &&
            readFileSync(p, "utf8") === String(process.pid)
          )
            unlinkSync(p);
        } catch {
          /* Trava já retirada. */
        }
      };
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
      try {
        if (agora - statSync(p).mtimeMs <= 2 * 3600_000)
          throw new Error(
            "Rotina já em execução: noite.lock tem menos de 2 horas"
          );
        unlinkSync(p);
      } catch (erro) {
        if ((erro as NodeJS.ErrnoException).code !== "ENOENT") throw erro;
      }
    }
  }
  throw new Error("Não foi possível adquirir noite.lock");
}
export function limpar(
  base: string,
  agora = Date.now(),
  preservar?: string
): void {
  for (const nome of readdirSync(base)) {
    if (nome === preservar || !/^\d{4}-\d{2}-\d{2}$/.test(nome)) continue;
    try {
      validarDia(nome);
    } catch {
      continue;
    }
    const p = join(base, nome);
    const s = lstatSync(p);
    // Só dias encerrados há mais de 60 dias; nunca seguir links simbólicos.
    if (
      s.isDirectory() &&
      !s.isSymbolicLink() &&
      agora - Date.parse(`${nome}T23:59:59-03:00`) > 60 * 86400_000
    )
      rmSync(p, { recursive: true });
  }
}
