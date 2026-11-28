import { Buffer } from "node:buffer";
import type { IncomingMessage } from "node:http";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../client/src/features/financas/dados.ts";
import { handleCapture, methodNotAllowed, type CapturePayment } from "../../shared/financas/captura.ts";

type Pedido = Pick<IncomingMessage, "method" | "headers"> &
  Partial<Pick<IncomingMessage, typeof Symbol.asyncIterator | "iterator" | "resume" | "readableEnded">> &
  { body?: unknown };
type Resposta = { setHeader(nome: string, valor: string): void; status(codigo: number): Resposta; json(valor: unknown): void };

const capturar: CapturePayment = (args) => {
  const url = process.env.VITE_SUPABASE_URL?.trim();
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) throw new Error("Captura indisponível.");
  const db = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return db.rpc("frtcash_capture_payment", args);
};

// A Vercel pode oferecer o fluxo original ou um corpo que já foi lido pela plataforma.
async function* blocos(req: Pedido): AsyncGenerator<Uint8Array> {
  let recebeu = false;
  const leitor = !req.readableEnded && (req.iterator?.({ destroyOnReturn: false }) ?? req[Symbol.asyncIterator]?.());
  if (leitor) {
    try {
      for (let item = await leitor.next(); !item.done; item = await leitor.next()) {
        const bloco = Buffer.isBuffer(item.value) ? item.value : Buffer.from(item.value);
        if (bloco.length) {
          recebeu = true;
          yield bloco;
        }
      }
    } finally {
      await leitor.return?.();
    }
  }
  if (recebeu) return;
  const corpo = req.body;
  if (corpo instanceof Uint8Array) yield corpo;
  else if (corpo !== undefined) yield Buffer.from(typeof corpo === "string" ? corpo : JSON.stringify(corpo));
}

function requisicao(req: Pedido): Request {
  const headers = new Headers();
  for (const nome of ["authorization", "content-length"]) {
    const valor = req.headers[nome];
    if (typeof valor === "string") headers.set(nome, valor);
  }
  const partes = blocos(req);
  const body = new ReadableStream<Uint8Array>({
    async pull(controle) {
      const item = await partes.next();
      if (item.done) controle.close();
      else controle.enqueue(item.value);
    },
    async cancel() {
      await partes.return(undefined);
      req.resume?.();
    },
  }, { highWaterMark: 0 });
  const init = { method: "POST", headers, body, duplex: "half" };
  return new Request("http://localhost/api/financas/captura", init);
}

export async function executarCaptura(req: Pedido, res: Resposta, rpc: CapturePayment = capturar) {
  const resposta = req.method === "POST" ? await handleCapture(requisicao(req), rpc) : methodNotAllowed();
  resposta.headers.forEach((valor, nome) => res.setHeader(nome, valor));
  res.status(resposta.status).json(await resposta.json());
}

export default executarCaptura;
