import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { carregarEstudio, ehEstudio, salvarEstudio, type Estudio } from "./estudio";
import { semente } from "./semente";
import { criarNuvem, lerNuvem, salvarNuvem, type ClienteConteudo } from "./nuvem";

/** Sem tabela, guarda localmente e sobe na próxima abertura com a migration aplicada. */
export type EstadoNuvem = "carregando" | "pronto" | "local" | "sem-conexao" | "invalido";

export function useEstudioNuvem(userId: string, avisar: (texto: string) => void) {
  const cliente = supabase as unknown as ClienteConteudo | null;
  const aviso = useRef(avisar);
  aviso.current = avisar;
  // Cada conta possui sua própria sessão. Respostas antigas não atravessam a troca de usuário.
  const sessao = useMemo(() => {
    let inicial: ReturnType<typeof carregarEstudio>;
    try { inicial = carregarEstudio(localStorage, userId, semente); }
    catch { inicial = { estudio: semente(), origem: "v1", erro: "Não foi possível ler o estúdio salvo." }; }
    return {
      inicial, estudio: inicial.estudio, confirmada: inicial.estudio,
      versao: 0, pendente: null as Estudio | null, rodando: false, viva: false,
      estado: (cliente ? "carregando" : "sem-conexao") as EstadoNuvem,
    };
  }, [userId, cliente]);
  const corrente = useRef(sessao);
  corrente.current = sessao;
  const [visao, setVisao] = useState(() => ({ sessao, estudio: sessao.estudio, estado: sessao.estado, salvando: false }));
  const atual = visao.sessao === sessao ? visao : { sessao, estudio: sessao.estudio, estado: sessao.estado, salvando: false };
  const ativa = useCallback(() => corrente.current === sessao && sessao.viva, [sessao]);
  const mostrar = useCallback((patch: Partial<Pick<typeof visao, "estudio" | "estado" | "salvando">>) => {
    if (!ativa()) return;
    if (patch.estudio) sessao.estudio = patch.estudio;
    if (patch.estado) sessao.estado = patch.estado;
    setVisao((anterior) => anterior.sessao === sessao ? { ...anterior, ...patch } : anterior);
  }, [sessao, ativa]);
  const guardarCopia = useCallback((estudio: Estudio) => {
    try { salvarEstudio(localStorage, userId, estudio); }
    catch { /* A nuvem continua sendo a fonte confirmada mesmo sem espaço local. */ }
  }, [userId]);
  const aceitar = useCallback((estudio: Estudio, versao: number) => {
    if (!ativa()) return;
    sessao.versao = versao;
    sessao.confirmada = estudio;
    mostrar({ estudio, estado: "pronto" });
    guardarCopia(estudio);
  }, [sessao, ativa, mostrar, guardarCopia]);

  useEffect(() => {
    let vivo = true;
    sessao.viva = true;
    sessao.estado = cliente ? "carregando" : "sem-conexao";
    setVisao({ sessao, estudio: sessao.estudio, estado: sessao.estado, salvando: false });
    if (cliente) void (async () => {
      try {
        let r = await lerNuvem(cliente, userId);
        if (!vivo || !ativa()) return;
        if (r.tipo === "vazio") {
          if (sessao.inicial.erro) { mostrar({ estado: "invalido" }); return; }
          const base = sessao.inicial.estudio;
          const c = await criarNuvem(cliente, userId, base);
          if (!vivo || !ativa()) return;
          if (c.tipo === "ok") {
            aceitar(base, c.versao);
            if (sessao.inicial.origem === "v1" && !sessao.inicial.erro) aviso.current("Seu estúdio deste navegador foi para a nuvem.");
            return;
          }
          r = c.tipo === "conflito" ? await lerNuvem(cliente, userId) : { tipo: "erro", mensagem: c.mensagem };
        }
        if (!vivo || !ativa()) return;
        if (r.tipo === "sem-tabela") {
          if (sessao.inicial.erro) mostrar({ estado: "invalido" });
          else {
            if (sessao.inicial.origem === "semente") guardarCopia(sessao.inicial.estudio);
            mostrar({ estado: "local" });
          }
        } else if (r.tipo === "ok") aceitar(r.estudio, r.versao);
        else mostrar({ estado: r.tipo === "invalido" ? "invalido" : "sem-conexao" });
      } catch { if (vivo && ativa()) mostrar({ estado: "sem-conexao" }); }
    })();
    return () => { vivo = false; sessao.viva = false; sessao.pendente = null; };
  }, [sessao, cliente, userId, ativa, aceitar, mostrar, guardarCopia]);

  const reler = useCallback(async (motivo?: string) => {
    if (!cliente || !ativa()) return;
    const antes = sessao.estudio;
    try {
      const r = await lerNuvem(cliente, userId);
      if (!ativa()) return;
      if (!motivo && (sessao.estudio !== antes || sessao.rodando || sessao.pendente)) return;
      if (r.tipo === "ok") {
        if (r.versao < sessao.versao) return;
        aceitar(r.estudio, r.versao); if (motivo) aviso.current(motivo);
      }
      else {
        mostrar({ estudio: sessao.confirmada, estado: r.tipo === "invalido" ? "invalido" : "sem-conexao" });
        if (motivo) aviso.current("Não foi possível reler o estúdio da nuvem. A edição foi bloqueada para preservar os dados.");
      }
    } catch {
      if (!motivo && (sessao.estudio !== antes || sessao.rodando || sessao.pendente)) return;
      if (ativa()) {
        mostrar({ estudio: sessao.confirmada, estado: "sem-conexao" });
        if (motivo) aviso.current("Sem conexão para reler o estúdio. A última alteração foi desfeita.");
      }
    }
  }, [cliente, userId, sessao, ativa, aceitar, mostrar]);

  const sincronizar = useCallback(async () => {
    if (!cliente || !ativa() || sessao.rodando) return;
    sessao.rodando = true;
    mostrar({ salvando: true });
    try {
      while (ativa() && sessao.pendente) {
        const alvo = sessao.pendente;
        sessao.pendente = null;
        const r = await salvarNuvem(cliente, userId, alvo, sessao.versao);
        if (!ativa()) return;
        if (r.tipo === "ok") {
          sessao.versao = r.versao;
          sessao.confirmada = alvo;
          guardarCopia(alvo);
        } else if (r.tipo === "conflito") {
          sessao.pendente = null;
          // Bloqueia novas edições até carregar a versão que venceu a concorrência.
          mostrar({ estado: "carregando" });
          await reler("O estúdio mudou em outro aparelho. Carreguei a versão mais nova; refaça a última alteração.");
        } else {
          sessao.pendente = null;
          mostrar({ estudio: sessao.confirmada, estado: "sem-conexao" });
          aviso.current(`Não salvou o estúdio (${r.mensagem}). A última alteração foi desfeita.`);
        }
      }
    } catch {
      sessao.pendente = null;
      if (ativa()) {
        mostrar({ estudio: sessao.confirmada, estado: "sem-conexao" });
        aviso.current("Sem conexão. A última alteração do estúdio foi desfeita.");
      }
    } finally {
      sessao.rodando = false;
      mostrar({ salvando: false });
    }
  }, [cliente, userId, sessao, ativa, mostrar, guardarCopia, reler]);

  function aplicar(op: (estudio: Estudio) => Estudio): boolean {
    if (!ativa() || (sessao.estado !== "pronto" && sessao.estado !== "local")) return false;
    let proximo: Estudio;
    try {
      proximo = op(sessao.estudio);
      if (!ehEstudio(proximo)) throw new Error("Estúdio inválido.");
    } catch (e) { aviso.current(e instanceof Error ? e.message : "Não foi possível fazer isso no estúdio."); return false; }
    if (sessao.estado === "local") {
      try { if (!salvarEstudio(localStorage, userId, proximo)) throw new Error(); }
      catch { aviso.current("Não foi possível salvar o estúdio neste navegador."); return false; }
      sessao.confirmada = proximo;
      mostrar({ estudio: proximo });
      return true;
    }
    mostrar({ estudio: proximo });
    sessao.pendente = proximo;
    void sincronizar();
    return true;
  }

  useEffect(() => {
    if (atual.estado !== "pronto") return;
    const ver = () => { if (document.visibilityState === "visible" && !sessao.rodando && !sessao.pendente) void reler(); };
    document.addEventListener("visibilitychange", ver);
    return () => document.removeEventListener("visibilitychange", ver);
  }, [atual.estado, sessao, reler]);
  useEffect(() => {
    if (!atual.salvando) return;
    const segurar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", segurar);
    return () => window.removeEventListener("beforeunload", segurar);
  }, [atual.salvando]);

  return { estudio: atual.estudio, aplicar, estado: atual.estado, salvando: atual.salvando };
}
