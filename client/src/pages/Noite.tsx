import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useLocation, useSearch } from "wouter";
import { Bot, ChevronLeft, ChevronRight, FileUp, FolderGit2, LoaderCircle, Moon, Sparkles, Terminal } from "lucide-react";
import InternalShell from "@/components/InternalShell";
import {
  ABAS, BarraDeAbas, Clientes, Conteudo, Fontes, Insights, LinhaDoTempo, Manchete, Noticias, PainelDoDia, PorProjetoBarras, Previas, Projetos, Secao, VoceDev,
  type Aba,
} from "@/components/noite/secoes";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { diaPorExtenso, lerArquivo, lerRelatorio, listarDias, type ClienteNoite } from "@/features/noite/nuvem";
import { ehDia, type Relatorio } from "@shared/noite/relatorio";

type Estado =
  | { tipo: "carregando" }
  | { tipo: "pronto"; relatorio: Relatorio; origem: "nuvem" | "arquivo" }
  | { tipo: "vazio" }
  | { tipo: "sem-tabela" }
  | { tipo: "sem-conexao" }
  | { tipo: "invalido" }
  | { tipo: "erro"; mensagem: string };

/**
 * Relatório da noite: o que o Codex e o Claude juntaram sobre o dia (commits,
 * conversas com IA, vault, notícias, conteúdo e prospecção). A rotina roda no
 * Mac (`pnpm noite`, agendada pelo launchd) e grava na tabela
 * `noite_relatorios`; aqui só se lê. Também abre o JSON salvo no Mac, para
 * quando a nuvem ainda não estiver configurada.
 */
export default function NoitePagina() {
  const { user } = useAuth();
  return user ? <Tela key={user.id} userId={user.id} /> : null;
}

/** Só no `pnpm dev`, sem login: abre o relatório por arquivo (prévia local). */
export function NoitePrevia() {
  return <Tela userId={null} />;
}

function Tela({ userId }: { userId: string | null }) {
  const [, navegar] = useLocation();
  const busca = new URLSearchParams(useSearch());
  const diaPedido = busca.get("dia");
  const [dias, setDias] = useState<string[]>([]);
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  // A aba escolhida vale para todas as noites: trocar de dia não volta para a visão geral
  const [aba, setAba] = useState<Aba>("geral");
  const arquivo = useRef<HTMLInputElement>(null);
  const cliente = supabase as unknown as ClienteNoite | null;

  // Lista os dias e abre o pedido na URL (ou o mais recente)
  useEffect(() => {
    let vivo = true;
    if (!cliente || !userId) {
      setEstado({ tipo: "sem-conexao" });
      return;
    }
    (async () => {
      const lista = await listarDias(cliente, userId);
      if (!vivo) return;
      if (lista.tipo === "sem-tabela") return setEstado({ tipo: "sem-tabela" });
      if (lista.tipo === "erro") return setEstado({ tipo: "erro", mensagem: lista.mensagem });
      setDias(lista.dias);
      const dia = diaPedido && ehDia(diaPedido) ? diaPedido : lista.dias[0];
      if (!dia) return setEstado({ tipo: "vazio" });
      setEstado({ tipo: "carregando" });
      const lido = await lerRelatorio(cliente, userId, dia);
      if (!vivo) return;
      if (lido.tipo === "ok") setEstado({ tipo: "pronto", relatorio: lido.relatorio, origem: "nuvem" });
      else if (lido.tipo === "erro") setEstado({ tipo: "erro", mensagem: lido.mensagem });
      else setEstado(lido);
    })();
    return () => {
      vivo = false;
    };
  }, [cliente, userId, diaPedido]);

  const atual = estado.tipo === "pronto" ? estado.relatorio.dia : diaPedido;
  const indice = atual ? dias.indexOf(atual) : -1;
  const irPara = (dia: string) => navegar(`?dia=${dia}`);
  const anterior = indice >= 0 && indice < dias.length - 1 ? dias[indice + 1] : null;
  const seguinte = indice > 0 ? dias[indice - 1] : null;

  const abrirArquivo = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const r = lerArquivo(await f.text());
    setEstado(r ? { tipo: "pronto", relatorio: r, origem: "arquivo" } : { tipo: "invalido" });
  };

  return (
    <InternalShell title="Noite">
      <div className="mx-auto max-w-[1280px]">
        {/* Cabeçalho: qual noite, navegação entre os dias e abrir arquivo */}
        <div className="flex flex-col gap-4 pt-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/55">
              <Moon aria-hidden size={14} className="text-[#8C99FF]" /> Relatório da noite
            </p>
            <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight sm:text-[2.1rem]">
              {estado.tipo === "pronto" ? diaPorExtenso(estado.relatorio.dia) : "Seu dia, contado pelos agentes"}
            </h1>
            <p className="mt-1 text-[14px] text-white/55">Codex pesquisa e lê o código do dia; Claude junta tudo e escreve. Roda sozinho toda noite.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {dias.length > 0 && (
              <div className="flex items-center rounded-xl bg-white/[0.06] p-1">
                <button type="button" disabled={!anterior} onClick={() => anterior && irPara(anterior)} aria-label="Noite anterior" className="grid h-9 w-9 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30">
                  <ChevronLeft size={18} />
                </button>
                <label className="sr-only" htmlFor="noite-dia">Escolher a noite</label>
                <select
                  id="noite-dia"
                  value={atual ?? ""}
                  onChange={(e) => irPara(e.target.value)}
                  className="h-9 rounded-lg bg-transparent px-2 text-[13.5px] font-medium text-white outline-none [&>option]:bg-[#16171C]"
                >
                  {dias.map((d) => (
                    <option key={d} value={d}>{diaPorExtenso(d)}</option>
                  ))}
                </select>
                <button type="button" disabled={!seguinte} onClick={() => seguinte && irPara(seguinte)} aria-label="Noite seguinte" className="grid h-9 w-9 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30">
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
            <button type="button" onClick={() => arquivo.current?.click()} className="flex h-11 items-center gap-2 rounded-xl bg-white/[0.06] px-3.5 text-[13.5px] font-medium text-white/80 hover:bg-white/10 hover:text-white">
              <FileUp size={16} /> Abrir arquivo
            </button>
            <input ref={arquivo} type="file" accept="application/json,.json" className="hidden" onChange={abrirArquivo} />
          </div>
        </div>

        {estado.tipo === "pronto" ? (
          <CorpoRelatorio r={estado.relatorio} arquivo={estado.origem === "arquivo"} aba={aba} mudarAba={setAba} />
        ) : (
          <Aviso estado={estado} />
        )}
      </div>
    </InternalShell>
  );
}

function CorpoRelatorio({ r, arquivo, aba, mudarAba }: { r: Relatorio; arquivo: boolean; aba: Aba; mudarAba: (a: Aba) => void }) {
  const topo = useRef<HTMLDivElement>(null);
  const ir = (a: Aba) => {
    mudarAba(a);
    // Rolou para baixo e trocou de aba: volta para o começo dela, logo abaixo das abas
    const alvo = topo.current;
    if (alvo && alvo.getBoundingClientRect().top < 0) window.scrollTo({ top: alvo.getBoundingClientRect().top + window.scrollY - 8, behavior: "smooth" });
  };
  const nome = ABAS.find((a) => a.id === aba)?.nome ?? "";
  return (
    <div>
      <div ref={topo} />
      <BarraDeAbas r={r} aba={aba} mudar={ir} />
      {arquivo && (
        <p className="mt-4 rounded-xl bg-amber-300/10 px-4 py-2.5 text-[13px] text-amber-100">Aberto de um arquivo do Mac. Este relatório não está na nuvem.</p>
      )}
      <div role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`} aria-label={nome} className="mt-6">
        {aba === "geral" && (
          <div className="space-y-4">
            <Manchete r={r} />
            <PainelDoDia itens={r.linhaDoTempo} m={r.metricas} />
            {r.plano && (
              <Secao id="noite-plano" icone={FolderGit2} titulo="O Plano hoje" apoio={r.plano.erro ? "A rotina não conseguiu atualizar o quadro." : "Atualizações sugeridas com base nas evidências do dia."} className="!mt-8">
                {r.plano.erro ? (
                  <p className="rounded-xl bg-amber-300/10 px-4 py-3 text-[13.5px] text-amber-100">{r.plano.erro}</p>
                ) : r.plano.criados.length + r.plano.concluidos.length === 0 ? (
                  <p className="rounded-xl bg-white/[0.035] px-4 py-3 text-[13.5px] text-white/60">Nenhuma mudança proposta hoje.</p>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {r.plano.criados.map((x) => <li key={`criado-${x.titulo}`} className="rounded-xl bg-white/[0.035] px-4 py-3 text-[13.5px]"><span className="font-semibold">Criado em {x.coluna}: {x.titulo}</span><span className="mt-1 block text-white/55">{x.evidencia}</span></li>)}
                    {r.plano.concluidos.map((x) => <li key={`feito-${x.titulo}`} className="rounded-xl bg-emerald-400/[0.08] px-4 py-3 text-[13.5px]"><span className="font-semibold">Concluído: {x.titulo}</span><span className="mt-1 block text-white/55">{x.evidencia}</span></li>)}
                  </ul>
                )}
              </Secao>
            )}
            <Secao id="noite-insights" icone={Sparkles} titulo="Insights" apoio="Cruzando o dia com o foco da semana e o funil de clientes." className="!mt-10">
              <Insights itens={r.insights} />
            </Secao>
            <div className="pt-6">
              <Previas r={r} ir={ir} />
            </div>
          </div>
        )}

        {aba === "dia" && (
          <>
            <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
              <LinhaDoTempo itens={r.linhaDoTempo} />
              <PorProjetoBarras itens={r.porProjeto} />
            </div>
            <Secao id="noite-projetos" icone={FolderGit2} titulo="Projetos" apoio="O que avançou em cada um e qual é o próximo passo." className="!mt-10">
              <Projetos itens={r.projetos} novos={r.projetosNovos} />
            </Secao>
          </>
        )}

        {aba === "noticias" && <Noticias itens={r.noticias} />}
        {aba === "conteudo" && <Conteudo itens={r.conteudo} />}
        {aba === "clientes" && <Clientes clientes={r.clientes} prospeccao={r.prospeccao} />}
        {aba === "dev" && <VoceDev d={r.dev} />}
      </div>

      <Fontes r={r} />
    </div>
  );
}

function Aviso({ estado }: { estado: Exclude<Estado, { tipo: "pronto" }> }) {
  if (estado.tipo === "carregando") {
    return (
      <div className="mt-24 flex items-center justify-center gap-2 text-white/60" role="status">
        <LoaderCircle className="animate-spin" size={18} /> Carregando o relatório
      </div>
    );
  }
  const textos: Record<Exclude<Estado, { tipo: "pronto" | "carregando" }>["tipo"], { titulo: string; texto: string }> = {
    vazio: {
      titulo: "Ainda não há relatório",
      texto: "A rotina roda sozinha às 23:30 (ou quando o Mac acordar). Para gerar agora, rode `pnpm noite` no portfolio-mf.",
    },
    "sem-tabela": {
      titulo: "Falta criar a tabela no Supabase",
      texto: "Rode o arquivo supabase/migrations/0004_noite.sql no SQL Editor do Supabase. Enquanto isso, dá para abrir o relatório salvo no Mac em Abrir arquivo.",
    },
    "sem-conexao": {
      titulo: "Sem conexão com a nuvem",
      texto: "Abra o relatório salvo no Mac em Abrir arquivo (fica em ~/.local/share/noite-mf/<dia>/relatorio.json).",
    },
    invalido: { titulo: "Relatório em formato inválido", texto: "O arquivo não segue o formato do relatório da noite." },
    erro: { titulo: "Não deu para ler o relatório", texto: estado.tipo === "erro" ? estado.mensagem : "" },
  };
  const { titulo, texto } = textos[estado.tipo];
  return (
    <div className="mx-auto mt-16 max-w-lg rounded-3xl bg-white/[0.035] p-8 text-center ring-1 ring-inset ring-white/[0.07]">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#0C2AFE]/25 text-[#B7C0FF]">
        {estado.tipo === "vazio" ? <Bot size={22} /> : <Terminal size={22} />}
      </span>
      <p className="mt-4 text-[1.15rem] font-semibold">{titulo}</p>
      <p className={cn("mt-2 text-[14px] leading-relaxed text-white/60")}>{texto}</p>
    </div>
  );
}
