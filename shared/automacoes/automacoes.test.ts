import { describe, expect, it } from "vitest";
import { casa, escolher, normalizar } from "./casar.ts";
import { montarMensagem } from "./mensagem.ts";
import { validarRascunho } from "./validar.ts";
import type { Automacao, Evento } from "./tipos.ts";

const evento:Evento={id:"evt",contaId:"conta_teste",automacaoId:null,tipo:"comentario",usuario:"teste",texto:"Olá, quero PREÇO!",postId:"post_a",situacao:"ignorado",erro:null,criadoEm:"2026-11-12T00:00:00Z"};
const automacao=(p:Partial<Automacao>={}):Automacao=>({id:"a",nome:"Teste",ativa:true,contas:["conta_teste"],gatilhos:["comentario"],posts:[],palavras:["preço"],correspondencia:"palavra",respostasPublicas:[],mensagem:"Oi {usuario}",botoes:[],criadaEm:"2026-11-01T00:00:00Z",atualizadaEm:"2026-11-01T00:00:00Z",versao:1,...p});
const rascunho={nome:"Teste",ativa:true,contas:["conta_teste"],gatilhos:["comentario"],posts:[],palavras:["preço"," preço "],correspondencia:"palavra",respostasPublicas:[],mensagem:"Olá {usuario}",botoes:[]};

describe("automacoes compartilhadas",()=>{
  it("normaliza acentos e maiúsculas",()=>expect(normalizar("  AÇÃO   ÚTIL ")).toBe("acao util"));
  it("palavra inteira não casa dentro de outra palavra",()=>{expect(casa(automacao({palavras:["sol"]}),{...evento,texto:"sol hoje"})).toBe(true);expect(casa(automacao({palavras:["sol"]}),{...evento,texto:"solução"})).toBe(false);});
  it("respeita post, conta e gatilho",()=>{expect(casa(automacao({posts:["outro"]}),evento)).toBe(false);expect(casa(automacao({contas:["outra"]}),evento)).toBe(false);expect(casa(automacao({gatilhos:["direct"]}),evento)).toBe(false);});
  it("palavra vazia casa sempre e exata compara texto inteiro",()=>{expect(casa(automacao({palavras:[]}),{...evento,texto:null})).toBe(true);expect(casa(automacao({correspondencia:"exata",palavras:["quero preco"]}),{...evento,texto:"Quero preço"})).toBe(true);});
  it("prioriza post específico, depois palavra e atualização recente",()=>{const a=automacao({id:"sem-palavra",palavras:[],atualizadaEm:"2026-11-12"});const b=automacao({id:"palavra",atualizadaEm:"2026-11-10"});const c=automacao({id:"post",posts:["post_a"],atualizadaEm:"2026-11-01"});expect(escolher([a,b,c],evento)?.id).toBe("post");expect(escolher([a,b],evento)?.id).toBe("palavra");expect(escolher([b,automacao({id:"recente",atualizadaEm:"2026-11-12"})],evento)?.id).toBe("recente");});
  it("valida limites e URL HTTPS e remove palavras duplicadas",()=>{const result=validarRascunho(rascunho);expect(result.ok).toBe(true);if(result.ok)expect(result.valor.palavras).toEqual(["preço"]);expect(validarRascunho({...rascunho,botoes:[{titulo:"Abrir",url:"http://example.com"}]}).ok).toBe(false);expect(validarRascunho({...rascunho,palavras:Array(21).fill("x")}).ok).toBe(false);});
  it("substitui usuário sem duplicar arroba e remove marcador vazio",()=>{expect(montarMensagem("Olá @{usuario}  !",{usuario:"@@bia"})).toBe("Olá @bia!");expect(montarMensagem("Olá {usuario}  tudo bem",{usuario:null})).toBe("Olá tudo bem");});
});
