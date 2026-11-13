import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { escolher } from "../../shared/automacoes/casar.ts";
import { automacaoDaLinha } from "../../shared/automacoes/linha.ts";
import { montarMensagem } from "../../shared/automacoes/mensagem.ts";
import type { Automacao, Evento, SituacaoEvento } from "../../shared/automacoes/tipos.ts";
import { assinaturaConfere, enviarDirect, responderComentarioPrivado, responderComentarioPublico, ZernioErro, type AvisoZernio } from "./zernio.ts";

type Req = AsyncIterable<Buffer | string> & { method?: string; headers: Record<string,string|string[]|undefined>; body?: unknown };
type Res = { status(n:number):Res; json(v:unknown):void; setHeader(k:string,v:string):void; end(v?:string):void };
type Dependencias = {
  db: Pick<SupabaseClient,"from">;
  enviarDirect: typeof enviarDirect;
  responderComentarioPrivado: typeof responderComentarioPrivado;
  responderComentarioPublico: typeof responderComentarioPublico;
};
const dbPadrao = () => {
  const url=process.env.VITE_SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("supabase_indisponivel");
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
};
const resposta=(res:Res,status:number,body:unknown)=>{res.setHeader("Cache-Control","no-store");res.setHeader("Content-Type","application/json; charset=utf-8");return res.status(status).json(body);};

/**
 * Corpo cru para conferir a assinatura. Lê o fluxo ANTES de tocar em req.body:
 * na Vercel, req.body é um getter que interpreta o JSON, e o texto reescrito
 * a partir do objeto pode não bater byte a byte com o que o Zernio assinou.
 * Só se o fluxo vier vazio (corpo já lido pela plataforma) usa req.body.
 */
export async function corpoCru(req:Req):Promise<Buffer>{
  const limite=1_000_000;
  const blocos:Buffer[]=[];let tamanho=0;
  if (typeof (req as any)[Symbol.asyncIterator] === "function") {
    for await (const parte of req) { const b=Buffer.isBuffer(parte)?parte:Buffer.from(parte); tamanho+=b.length; if(tamanho>limite) throw new Error("corpo_grande"); blocos.push(b); }
  }
  if (tamanho>0) return Buffer.concat(blocos);
  const corpo=req.body;
  const b=Buffer.isBuffer(corpo)?corpo:typeof corpo==="string"?Buffer.from(corpo):corpo&&typeof corpo==="object"?Buffer.from(JSON.stringify(corpo)):Buffer.alloc(0);
  if(b.length>limite)throw new Error("corpo_grande");
  return b;
}

function statusDeErro(e:unknown):{situacao:SituacaoEvento;codigo:string}{
  if (e instanceof ZernioErro) return {situacao:/^(incerto_|rede_ou_timeout)/.test(e.codigo)?"incerto":"falhou",codigo:e.codigo.slice(0,100)};
  return {situacao:"incerto",codigo:"falha_interna"};
}

export async function processarAviso(aviso:AvisoZernio, dependencias?:Dependencias):Promise<void>{
  if (!aviso || aviso.test || !["comment.received","message.received"].includes(aviso.event ?? "") || aviso.account?.platform !== "instagram" || !aviso.account.id) return;
  const comentario=aviso.event === "comment.received" ? aviso.comment : undefined;
  const msg=aviso.event === "message.received" ? aviso.message : undefined;
  if (comentario && (comentario.platform !== "instagram" || comentario.author?.isOwnAccount)) return;
  if (msg && (msg.platform !== "instagram" || msg.direction !== "incoming" || msg.metadata?.standby || aviso.metadata?.standby || msg.metadata?.isStoryMention || aviso.metadata?.isStoryMention || msg.attachments?.some(a=>a.originalType === "story_mention"))) return;
  if (!comentario && !msg) return;
  const contaId=aviso.account.id;
  const tipo=comentario ? "comentario" : (msg?.metadata?.storyReply || aviso.metadata?.storyReply) ? "story" : "direct";
  // Execução inline para devolver o ACK do Zernio no próprio request sem depender de worker.
  // A chamada externa usa o tempo restante de um orçamento de 4 s, deixando folga para o ACK.
  const prazo=Date.now()+4_000;
  const tempoRestante=()=>{const restante=prazo-Date.now()-100;if(restante<=0)throw new ZernioErro("incerto_timeout");return restante;};
  const id=comentario?.id ?? msg?.platformMessageId;
  if (!id || id.length>240 || (comentario && !comentario.platformPostId)) return;
  const evento:Evento={id,contaId,automacaoId:null,tipo,usuario:comentario?.author?.username ?? msg?.sender?.username ?? null,texto:comentario?.text ?? msg?.text ?? null,postId:comentario?.platformPostId ?? null,situacao:"ignorado",erro:null,criadoEm:new Date().toISOString()};
  const d=dependencias ?? {db:dbPadrao(),enviarDirect,responderComentarioPrivado,responderComentarioPublico};
  const {data:conta,error:erroConta}=await d.db.from("auto_contas").select("owner,ativa").eq("id",contaId).maybeSingle();
  if (erroConta || !conta?.ativa || !conta.owner) return;
  const owner=conta.owner as string;
  const criado=await d.db.from("auto_eventos").insert({owner,id,conta_id:contaId,automacao_id:null,tipo,usuario:evento.usuario,texto:evento.texto,post_id:evento.postId,situacao:"ignorado",erro:null}).select("id").single();
  if (criado.error) { if (criado.error.code === "23505") return; throw new Error("evento_nao_registrado"); }
  const atualizar=async (situacao:SituacaoEvento, automacaoId:string|null=null, erro:string|null=null)=>{
    await d.db.from("auto_eventos").update({situacao,automacao_id:automacaoId,erro}).eq("owner",owner).eq("id",id);
  };
  try {
    const {data:linhas,error}=await d.db.from("auto_automacoes").select("*").eq("owner",owner).eq("ativa",true);
    if(error) throw new Error("automacoes_indisponiveis");
    const automacoes=(linhas??[]).map(l=>automacaoDaLinha(l as Record<string,any>));
    const automacao:Automacao|null=escolher(automacoes,evento);
    if(!automacao){await atualizar("ignorado");return;}
    await atualizar("incerto",automacao.id);
    const mensagem=montarMensagem(automacao.mensagem,{usuario:evento.usuario});
    if(tipo === "comentario") {
      await d.responderComentarioPrivado(contaId,comentario!.platformPostId!,id,mensagem,automacao.botoes,tempoRestante());
      if(automacao.respostasPublicas.length) {
        const n=Number.parseInt(createHash("sha256").update(id).digest("hex").slice(0,8),16)%automacao.respostasPublicas.length;
        await d.responderComentarioPublico(contaId,comentario!.platformPostId!,id,automacao.respostasPublicas[n],tempoRestante());
      }
    } else {
      if(!msg?.conversationId) throw new ZernioErro("conversa_ausente");
      await d.enviarDirect(contaId,msg.conversationId,mensagem,automacao.botoes,tempoRestante());
    }
    await atualizar("enviado",automacao.id);
  } catch(e) {
    const falha=statusDeErro(e);
    await atualizar(falha.situacao,undefined as never, falha.codigo);
  }
}

export default async function handler(req:Req,res:Res){
  if(req.method!=="POST") return resposta(res,405,{erro:"Use POST."});
  let raw:Buffer;
  try{raw=await corpoCru(req);}catch{return resposta(res,413,{erro:"Corpo inválido."});}
  if(!assinaturaConfere(raw,req.headers["x-zernio-signature"])) return resposta(res,401,{erro:"Assinatura inválida."});
  let aviso:AvisoZernio;
  try{aviso=JSON.parse(raw.toString("utf8")) as AvisoZernio;}catch{return resposta(res,400,{erro:"JSON inválido."});}
  try{await processarAviso(aviso);return resposta(res,200,{ok:true});}
  catch{return resposta(res,503,{erro:"Evento não processado."});}
}

export const config={api:{bodyParser:false}};
