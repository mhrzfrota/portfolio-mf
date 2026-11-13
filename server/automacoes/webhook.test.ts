import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { processarAviso, default as handler } from "./webhook.ts";
import { assinaturaConfere, ZernioErro, type AvisoZernio } from "./zernio.ts";

const base={id:"auto_teste",nome:"Teste",ativa:true,contas:["conta_teste"],gatilhos:["comentario","direct","story"],posts:[],palavras:[],correspondencia:"palavra",respostas_publicas:[],mensagem:"Olá {usuario}",botoes:[],criada_em:"2026-11-01",atualizada_em:"2026-11-02",versao:1};
function banco({ativa=true,duplicado=false,automacoes=[base]}:{ativa?:boolean;duplicado?:boolean;automacoes?:any[]}={}){
  const atualizados:any[]=[];let insertou=0;const ids=new Set<string>();
  const db:any={from:(table:string)=>{
    let op="select",payload:any,filters:Record<string,unknown>={};
    const q:any={select:()=>q,eq:(k:string,v:unknown)=>(filters[k]=v,q),maybeSingle:async()=>({data:table==="auto_contas"?{owner:"owner_teste",ativa}:null,error:null}),insert:(v:any)=>(op="insert",payload=v,q),update:(v:any)=>(op="update",payload=v,q),single:async()=>{insertou++;if(duplicado||ids.has(payload.id))return {data:null,error:{code:"23505"}};ids.add(payload.id);return {data:{id:payload.id},error:null};},then:(resolve:any)=>resolve(table==="auto_automacoes"?{data:automacoes,error:null}:{data:null,error:null})};
    if(table==="auto_eventos") { const old=q.update; q.update=(v:any)=>(op="update",payload=v,atualizados.push(v),q); }
    return q;
  }};
  return {db,atualizados,get insertou(){return insertou;}};
}
const deps=(b:ReturnType<typeof banco>,calls:any[]=[],send:()=>Promise<any>=async()=>({}))=>({db:b.db,enviarDirect:vi.fn(async(...args:any[])=>{calls.push(["direct",...args]);return send();}),responderComentarioPrivado:vi.fn(async(...args:any[])=>{calls.push(["private",...args]);return send();}),responderComentarioPublico:vi.fn(async(...args:any[])=>{calls.push(["public",...args]);return send();})});
const comment=(overrides:Record<string,unknown>={}):AvisoZernio=>({event:"comment.received",account:{id:"conta_teste",platform:"instagram"},comment:{id:"evt_teste",platform:"instagram",platformPostId:"post_teste",text:"oi",author:{id:"pessoa_teste",username:"bia"}},...overrides} as AvisoZernio);
const message=(metadata:any={},event="message.received",id="msg_teste"):AvisoZernio=>({event,account:{id:"conta_teste",platform:"instagram"},message:{platform:"instagram",platformMessageId:id,direction:"incoming",text:"oi",conversationId:"conversa_teste",sender:{id:"pessoa_teste",username:"bia"},metadata}});

afterEach(()=>{vi.restoreAllMocks();});
describe("webhook automações",()=>{
  it("recusa assinatura inválida com 401 sem ler conteúdo para processar",async()=>{
    const req:any={method:"POST",headers:{"x-zernio-signature":"inválida"},body:Buffer.from("{}")};let status=0;const res:any={setHeader:()=>{},status:(n:number)=>(status=n,res),json:()=>{}};
    const out=await handler(req,res);expect(out).toBeUndefined();expect(status).toBe(401);
  });
  it("processa evento duplicado uma única vez",async()=>{const b=banco(),calls:any[]=[];const d=deps(b,calls);await processarAviso(comment(),d as any);await processarAviso(comment(),d as any);expect(b.insertou).toBe(2);expect(calls.filter(x=>x[0]==="private")).toHaveLength(1);});
  it("conta inativa não grava nem chama o Zernio",async()=>{const b=banco({ativa:false}),calls:any[]=[];await processarAviso(comment(),deps(b,calls) as any);expect(b.insertou).toBe(0);expect(calls).toHaveLength(0);});
  it("ignora comentário da própria conta antes de persistir",async()=>{const b=banco(),calls:any[]=[];await processarAviso(comment({comment:{id:"evt_teste",platform:"instagram",platformPostId:"post_teste",author:{isOwnAccount:true}}}),deps(b,calls) as any);expect(b.insertou).toBe(0);});
  it("classifica story e direct e responde uma vez cada",async()=>{const b=banco({automacoes:[{...base,gatilhos:["direct","story"]}]}),calls:any[]=[];await processarAviso(message({storyReply:{storyId:"story_teste"}}),deps(b,calls) as any);await processarAviso(message({},"message.received","msg_direct"),deps(b,calls) as any);expect(calls).toHaveLength(2);expect(calls.every(x=>x[0]==="direct")).toBe(true);});
  it("timeout registra incerto e não inclui chave em erro",async()=>{process.env.ZERNIO_API_KEY="chave_sintetica_teste";const b=banco(),calls:any[]=[];await processarAviso(comment(),deps(b,calls,async()=>{throw new ZernioErro("rede_ou_timeout");}) as any);expect(b.atualizados.some(x=>x.situacao==="incerto"&&x.erro==="rede_ou_timeout")).toBe(true);expect(JSON.stringify(b.atualizados)).not.toContain(process.env.ZERNIO_API_KEY);delete process.env.ZERNIO_API_KEY;});
  it("confere HMAC em tempo constante com o corpo cru",()=>{const raw="{\"event\":\"test\"}",secret="segredo_teste",sig=createHmac("sha256",secret).update(raw).digest("hex");expect(assinaturaConfere(Buffer.from(raw),sig,secret)).toBe(true);expect(assinaturaConfere(Buffer.from(raw),"0".repeat(64),secret)).toBe(false);});
});

describe("corpo cru do webhook",()=>{
  it("usa o fluxo e nem toca em req.body quando o fluxo traz o corpo",async()=>{
    const {corpoCru}=await import("./webhook.ts");
    const raw='{"event": "test",  "a":1}';let tocou=false;
    const req:any={headers:{},async *[Symbol.asyncIterator](){yield Buffer.from(raw);},get body(){tocou=true;return JSON.parse(raw);}};
    expect((await corpoCru(req)).toString()).toBe(raw);expect(tocou).toBe(false);
  });
  it("cai para req.body quando o fluxo já foi lido pela plataforma",async()=>{
    const {corpoCru}=await import("./webhook.ts");
    const req:any={headers:{},async *[Symbol.asyncIterator](){},body:Buffer.from("{}")};
    expect((await corpoCru(req)).toString()).toBe("{}");
  });
});
