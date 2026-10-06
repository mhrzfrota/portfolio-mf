import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { carregarAgenda, salvarAgenda, sementeAgenda, type Agenda } from "./agenda";
import { criarNuvem, lerNuvem, salvarNuvem, type ClienteCalendario } from "./nuvem";

/** "local": a tabela ainda não existe no Supabase; salva só no navegador e sobe quando ela existir. */
export type EstadoNuvem = "carregando" | "pronto" | "local" | "sem-conexao" | "invalido";

/**
 * A agenda mora no Supabase. O navegador guarda só uma cópia para abrir
 * rápido e para a primeira subida (quem já usava o calendário local não
 * perde nada). Edição só com a nuvem respondendo, para não divergir.
 */
export function useAgendaNuvem(userId: string, avisar: (texto: string) => void) {
  const [inicial] = useState(() => {
    try {
      return carregarAgenda(localStorage, userId, sementeAgenda);
    } catch {
      return { agenda: sementeAgenda(), nova: true, erro: "" };
    }
  });
  const [agenda, setAgenda] = useState<Agenda>(inicial.agenda);
  const [estado, setEstado] = useState<EstadoNuvem>(supabase ? "carregando" : "sem-conexao");
  const [salvando, setSalvando] = useState(false);
  const cliente = supabase as unknown as ClienteCalendario | null;
  const versao = useRef(0);
  const confirmada = useRef<Agenda>(inicial.agenda);
  const pendente = useRef<Agenda | null>(null);
  const rodando = useRef(false);

  const guardarCopia = (a: Agenda) => {
    try {
      salvarAgenda(localStorage, userId, a);
    } catch {
      /* cópia local é só conveniência */
    }
  };
  const aceitar = useCallback((a: Agenda, v: number) => {
    versao.current = v;
    confirmada.current = a;
    setAgenda(a);
    guardarCopia(a);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Primeira leitura: nuvem; se ainda não existe, sobe o que está no navegador (ou a semente)
  useEffect(() => {
    if (!cliente) return;
    let vivo = true;
    (async () => {
      try {
        let r = await lerNuvem(cliente, userId);
        if (r.tipo === "vazio") {
          const base = inicial.erro ? sementeAgenda() : inicial.agenda;
          const c = await criarNuvem(cliente, userId, base);
          if (c.tipo === "ok") {
            if (vivo) {
              aceitar(base, c.versao);
              setEstado("pronto");
              if (!inicial.nova && !inicial.erro) avisar("Seu calendário deste navegador foi para a nuvem.");
            }
            return;
          }
          r = c.tipo === "conflito" ? await lerNuvem(cliente, userId) : { tipo: "erro", mensagem: c.mensagem };
        }
        if (!vivo) return;
        if (r.tipo === "sem-tabela") {
          if (inicial.erro) setEstado("invalido");
          else {
            if (inicial.nova) guardarCopia(inicial.agenda);
            setEstado("local");
          }
          return;
        }
        if (r.tipo === "ok") {
          aceitar(r.agenda, r.versao);
          setEstado("pronto");
        } else setEstado(r.tipo === "invalido" ? "invalido" : "sem-conexao");
      } catch {
        if (vivo) setEstado("sem-conexao");
      }
    })();
    return () => {
      vivo = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const reler = useCallback(async (motivo?: string) => {
    if (!cliente) return;
    const r = await lerNuvem(cliente, userId);
    if (r.tipo === "ok") {
      aceitar(r.agenda, r.versao);
      if (motivo) avisar(motivo);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Grava sempre a versão mais recente; mudanças rápidas viram uma gravação só
  const sincronizar = useCallback(async () => {
    if (!cliente || rodando.current) return;
    rodando.current = true;
    setSalvando(true);
    try {
      while (pendente.current) {
        const alvo = pendente.current;
        pendente.current = null;
        const r = await salvarNuvem(cliente, userId, alvo, versao.current);
        if (r.tipo === "ok") {
          versao.current = r.versao;
          confirmada.current = alvo;
          guardarCopia(alvo);
        } else if (r.tipo === "conflito") {
          pendente.current = null;
          await reler("O calendário mudou em outro aparelho. Carreguei a versão mais nova; refaça a última alteração.");
        } else {
          pendente.current = null;
          setAgenda(confirmada.current);
          avisar(`Não salvou (${r.mensagem}). A última alteração foi desfeita.`);
        }
      }
    } catch {
      pendente.current = null;
      setAgenda(confirmada.current);
      avisar("Sem conexão. A última alteração foi desfeita.");
    } finally {
      rodando.current = false;
      setSalvando(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Aplica na tela na hora e manda para a nuvem. Falso quando a regra recusa. */
  function aplicar(op: (a: Agenda) => Agenda): boolean {
    if (estado !== "pronto" && estado !== "local") return false;
    let prox: Agenda;
    try {
      prox = op(agenda);
    } catch (e) {
      avisar(e instanceof Error ? e.message : "Não foi possível fazer isso.");
      return false;
    }
    if (estado === "local") {
      // Sem tabela na nuvem: o navegador guarda; na primeira abertura com a tabela criada, isto sobe
      try {
        if (!salvarAgenda(localStorage, userId, prox)) throw new Error();
      } catch {
        avisar("Não foi possível salvar neste navegador.");
        return false;
      }
      confirmada.current = prox;
      setAgenda(prox);
      return true;
    }
    setAgenda(prox);
    pendente.current = prox;
    void sincronizar();
    return true;
  }

  // Voltou para a aba: busca o que mudou em outro aparelho (se nada estiver pendente)
  useEffect(() => {
    if (estado !== "pronto") return;
    const ver = () => {
      if (document.visibilityState === "visible" && !rodando.current && !pendente.current) void reler();
    };
    document.addEventListener("visibilitychange", ver);
    return () => document.removeEventListener("visibilitychange", ver);
  }, [estado, reler]);

  // Fechar a aba com gravação no meio pede confirmação
  useEffect(() => {
    if (!salvando) return;
    const segurar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", segurar);
    return () => window.removeEventListener("beforeunload", segurar);
  }, [salvando]);

  return { agenda, aplicar, estado, salvando };
}
