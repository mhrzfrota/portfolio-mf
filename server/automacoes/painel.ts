import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { PedidoPainel, RespostaPainel } from "../../shared/automacoes/tipos.ts";
import { listarContas, listarPublicacoes, listarWebhooks, registrarWebhook, ZernioErro } from "./zernio.ts";

type Req={method?:string;headers:Record<string,string|string[]|undefined>;body?:unknown};
type Res={status(n:number):Res;json(v:unknown):void;setHeader(k:string,v:string):void};
type Deps={anon:Pick<SupabaseClient,"auth">;admin:Pick<SupabaseClient,"from">;contas:typeof listarContas;publicacoes:typeof listarPublicacoes;webhooks:typeof listarWebhooks;registrar:typeof registrarWebhook;agora?:()=>number};
const limite=new Map<string,number[]>();
const padrao=():Deps=>{
  const url=process.env.VITE_SUPABASE_URL,anonKey=process.env.VITE_SUPABASE_PUBLISHABLE_KEY??process.env.VITE_SUPABASE_ANON_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!anonKey||!service) throw new Error("supabase_ausente");
  return {anon:createClient(url,anonKey,{auth:{persistSession:false,autoRefreshToken:false}}),admin:createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}}),contas:listarContas,publicacoes:listarPublicacoes,webhooks:listarWebhooks,registrar:registrarWebhook};
};
const responder=(res:Res,status:number,body:RespostaPainel|{erro:string})=>{res.setHeader("Cache-Control","no-store");res.setHeader("Pragma","no-cache");return res.status(status).json(body);};
function erroCodigo(e:unknown){return e instanceof ZernioErro?e.codigo:"falha_interna";}
function pedidoDoBody(body:unknown):PedidoPainel|null{
  if(!body||typeof body!=="object"||Array.isArray(body))return null;
  const b=body as Record<string,unknown>;
  if(b.acao==="sincronizar-contas"||b.acao==="situacao"||b.acao==="registrar-webhook")return {acao:b.acao};
  if(b.acao==="publicacoes"&&typeof b.contaId==="string"&&b.contaId.length>0&&b.contaId.length<=200)return {acao:b.acao,contaId:b.contaId};
  return null;
}
function dentroDoLimite(id:string,agora:number){
  const recentes=(limite.get(id)??[]).filter(t=>agora-t<60_000);
  if(recentes.length>=30){limite.set(id,recentes);return false;}
  recentes.push(agora);limite.set(id,recentes);
  if(limite.size>5_000) for(const [chave,vals] of limite) if(!vals.some(t=>agora-t<60_000))limite.delete(chave);
  return true;
}
async function executar(p:PedidoPainel,owner:string,d:Deps):Promise<RespostaPainel>{
  if(p.acao==="sincronizar-contas"){
    // O banco só aceita foto https e textos curtos: uma conta fora do padrão não pode derrubar a sincronização inteira.
    const externas=(await d.contas()).filter(c=>c.id.length<=200&&c.usuario.length>=1).map(c=>({id:c.id,usuario:c.usuario.slice(0,100),nome:c.nome?c.nome.slice(0,200):null,foto:c.foto&&c.foto.startsWith("https://")&&c.foto.length<=2048?c.foto:null}));
    const {data:atuais,error:erroLeitura}=await d.admin.from("auto_contas").select("id,ativa").eq("owner",owner);
    if(erroLeitura)throw new Error("banco_indisponivel");
    const porId=new Map((atuais??[]).map((c:any)=>[c.id,c]));
    const ids=new Set(externas.map(c=>c.id));
    if(externas.length){
      const gravadas=await d.admin.from("auto_contas").upsert(externas.map(c=>({owner,id:c.id,usuario:c.usuario,nome:c.nome,foto:c.foto,ativa:porId.get(c.id)?.ativa??false,sincronizada_em:new Date().toISOString()})),{onConflict:"owner,id"});
      if(gravadas.error)throw new Error("banco_indisponivel");
    }
    const sumidas=(atuais??[]).filter((c:any)=>!ids.has(c.id)).map((c:any)=>c.id);
    if(sumidas.length){const atualizada=await d.admin.from("auto_contas").update({ativa:false,sincronizada_em:new Date().toISOString()}).eq("owner",owner).in("id",sumidas);if(atualizada.error)throw new Error("banco_indisponivel");}
    return {ok:true,acao:p.acao,contas:externas.map(c=>({id:c.id,usuario:c.usuario,nome:c.nome,foto:c.foto,ativa:porId.get(c.id)?.ativa??false,sincronizadaEm:new Date().toISOString()}))};
  }
  if(p.acao==="publicacoes"){
    const {data:conta,error}=await d.admin.from("auto_contas").select("id").eq("owner",owner).eq("id",p.contaId).maybeSingle();
    if(error||!conta)throw new Error("conta_nao_encontrada");
    return {ok:true,acao:p.acao,publicacoes:await d.publicacoes(p.contaId)};
  }
  const urlBase=process.env.AUTOMACOES_BASE_URL?.trim()??"";
  let webhookUrl:string|null=null;
  if(urlBase){try{const u=new URL(urlBase);if(u.protocol==="https:"&&u.username===""&&u.password==="")webhookUrl=new URL("/api/automacoes/webhook",u).toString();}catch{/* url inválida fica ausente */}}
  const secrets=Boolean(process.env.AUTOMACOES_WEBHOOK_SECRET?.trim()),key=Boolean(process.env.ZERNIO_API_KEY?.trim());
  const webhooks=key&&webhookUrl?await d.webhooks():[];
  const webhookRegistrado=Boolean(webhookUrl&&webhooks.some(w=>w?.url===webhookUrl&&w?.isActive!==false));
  const situacao={chaveConfigurada:key,segredoConfigurado:secrets,webhookRegistrado,webhookUrl};
  if(p.acao==="situacao")return {ok:true,acao:p.acao,situacao};
  if(!webhookUrl||!secrets||!key)throw new Error("configuracao_incompleta");
  await d.registrar(webhookUrl,process.env.AUTOMACOES_WEBHOOK_SECRET!.trim());
  return {ok:true,acao:p.acao,situacao:{...situacao,webhookRegistrado:true}};
}

export async function executarPainel(req:Req,res:Res,dependencias?:Deps){
  if(req.method!=="POST")return responder(res,405,{erro:"Use POST."});
  const raw=req.headers.authorization,auth=Array.isArray(raw)?raw[0]:raw;
  const token=auth?.match(/^Bearer\s+([^\s]+)$/i)?.[1];
  if(!token)return responder(res,401,{erro:"Sessão ausente."});
  let d:Deps;try{d=dependencias??padrao();}catch{return responder(res,503,{erro:"Supabase não configurado."});}
  const {data,error}=await d.anon.auth.getUser(token);
  if(error||!data.user)return responder(res,401,{erro:"Sessão inválida ou expirada."});
  const agora=d.agora?.()??Date.now();
  if(!dentroDoLimite(data.user.id,agora))return responder(res,429,{erro:"Limite temporário atingido."});
  let body=req.body;
  if(Buffer.isBuffer(body)){try{body=JSON.parse(body.toString("utf8"));}catch{return responder(res,400,{erro:"Pedido inválido."});}}
  const pedido=pedidoDoBody(body);if(!pedido)return responder(res,400,{erro:"Ação inválida."});
  const papel=await d.admin.from("radar_papeis").select("papel").eq("user_id",data.user.id).maybeSingle();
  if(papel.error)return responder(res,503,{erro:"Não foi possível validar o acesso."});
  if(papel.data?.papel==="parceiro")return responder(res,403,{erro:"Apenas o dono pode usar Automações."});
  if(papel.data?.papel!=="dono")return responder(res,403,{erro:"Acesso não autorizado."});
  try{return responder(res,200,await executar(pedido,data.user.id,d));}
  catch(e){return responder(res,502,{ok:false,erro:e instanceof Error&&["conta_nao_encontrada","configuracao_incompleta"].includes(e.message)?e.message:"Não foi possível concluir a ação.",...(e instanceof ZernioErro?{codigo:erroCodigo(e)}:{})});}
}
export default executarPainel;
