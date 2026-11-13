import { ChevronLeft, Heart, Phone, Video } from "lucide-react";
import type { AutomacaoRascunho, Conta, Gatilho } from "@shared/automacoes/tipos";
import { Avatar } from "./pecas";

const VISITANTE = "ana.souza";

function preencher(modelo: string) {
  return modelo.replace(/\{usuario\}/gi, VISITANTE).replace(/ {2,}/g, " ").trim();
}

/**
 * Prévia ao vivo: como a pessoa vê a conversa no Instagram. Só desenho, nada
 * é enviado daqui.
 */
export default function Telefone({ rascunho, conta, gatilho }: { rascunho: AutomacaoRascunho; conta: Pick<Conta, "id" | "usuario" | "foto"> | null; gatilho: Gatilho }) {
  const perfil = conta ?? { id: "sem-conta", usuario: "sua.conta", foto: null };
  const palavra = rascunho.palavras[0] || (gatilho === "direct" ? "Oi, tudo bem?" : "quero");
  const publica = rascunho.respostasPublicas.find((r) => r.trim());
  const mensagem = preencher(rascunho.mensagem);

  return (
    <div className="mx-auto w-full max-w-[320px]">
      <div className="rounded-[42px] border border-white/[0.14] bg-black p-2.5 shadow-[0_40px_80px_-30px_rgba(12,42,254,0.55)]">
        <div className="relative flex h-[600px] flex-col overflow-hidden rounded-[34px] bg-[#0b0b0d]">
          <span className="absolute left-1/2 top-2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />

          {/* Cabeçalho do Direct */}
          <div className="flex items-center gap-2.5 border-b border-white/[0.07] px-3.5 pb-2.5 pt-11">
            <ChevronLeft size={22} className="text-white" />
            <Avatar conta={perfil} tamanho={30} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold leading-tight">{perfil.usuario}</p>
              <p className="text-[10.5px] leading-tight text-white/45">Conta comercial</p>
            </div>
            <Phone size={18} className="text-white/85" />
            <Video size={20} className="text-white/85" />
          </div>

          <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-3 py-3.5 [scrollbar-width:none]">
            {gatilho === "comentario" && (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-2.5">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-white/35">Na publicação</p>
                <div className="flex gap-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/15 text-[10px] font-semibold uppercase">{VISITANTE[0]}</span>
                  <p className="flex-1 text-[12px] leading-snug"><b className="font-semibold">{VISITANTE}</b> {palavra}</p>
                  <Heart size={11} className="mt-1 text-white/40" />
                </div>
                {publica && (
                  <div className="ml-8 mt-2 flex gap-2">
                    <Avatar conta={perfil} tamanho={20} />
                    <p className="flex-1 text-[12px] leading-snug"><b className="font-semibold">{perfil.usuario}</b> {preencher(publica)}</p>
                  </div>
                )}
              </div>
            )}

            {gatilho === "story" && (
              <div className="ml-auto max-w-[78%]">
                <p className="mb-1 text-right text-[10px] text-white/40">Respondeu ao seu story</p>
                <div className="ml-auto h-24 w-16 rounded-xl bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] opacity-70" />
              </div>
            )}

            {gatilho !== "comentario" && (
              <p className="ml-auto max-w-[78%] rounded-[20px] rounded-br-md bg-[#3797F0] px-3.5 py-2 text-[13px] leading-snug">{palavra}</p>
            )}

            <p className="my-0.5 text-center text-[10px] text-white/30">agora</p>

            {/* A resposta automática */}
            <div className="flex items-end gap-1.5">
              <Avatar conta={perfil} tamanho={22} />
              <div className="max-w-[80%] overflow-hidden rounded-[20px] rounded-bl-md bg-[#262629]">
                <p className="whitespace-pre-wrap break-words px-3.5 py-2 text-[13px] leading-snug">
                  {mensagem || <span className="text-white/35">Escreva a mensagem do Direct…</span>}
                </p>
                {rascunho.botoes.filter((b) => b.titulo.trim()).map((b, i) => (
                  <span key={i} className="block border-t border-white/[0.09] px-3.5 py-2.5 text-center text-[13px] font-semibold text-[#5AA9FF]">{b.titulo}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mx-3 mb-4 flex items-center rounded-full border border-white/[0.14] px-4 py-2.5 text-[12.5px] text-white/35">Mensagem…</div>
        </div>
      </div>
      <p className="mt-3 text-center text-[12px] text-white/40">Prévia. Nada é enviado daqui.</p>
    </div>
  );
}
