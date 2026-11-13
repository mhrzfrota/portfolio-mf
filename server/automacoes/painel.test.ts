import { describe, expect, it, vi } from "vitest";
import { executarPainel } from "./painel.ts";

function setup({papel="dono",atuais=[{id:"conta_teste",ativa:true}]}:{papel?:string|null;atuais?:any[]}={}){
  const writes:any[]=[];
  const deps:any={anon:{auth:{getUser:vi.fn(async(token:string)=>token==="jwt_teste"?{data:{user:{id:"owner_teste"}},error:null}:{data:{user:null},error:new Error("invalid")})}},admin:{from:(table:string)=>{
    let operation="select",payload:any,filters:any={};const q:any={select:()=>q,eq:(k:string,v:any)=>(filters[k]=v,q),maybeSingle:async()=>({data:table==="radar_papeis"?(papel?{papel}:null):null,error:null}),then:(resolve:any)=>resolve({data:table==="auto_contas"?atuais:[],error:null}),upsert:(v:any)=>(operation="upsert",payload=v,q),update:(v:any)=>(operation="update",payload=v,q),in:()=>q};
    if(table==="auto_contas"){q.upsert=(v:any)=>(writes.push({operation:"upsert",value:v}),q);q.update=(v:any)=>(writes.push({operation:"update",value:v}),q);}
    return q;
  }},contas:vi.fn(async()=>[{id:"conta_teste",usuario:"conta_teste",nome:null,foto:null}]),publicacoes:vi.fn(async()=>[]),webhooks:vi.fn(async()=>[]),registrar:vi.fn(async()=>true),agora:()=>1000};
  return {deps,writes};
}
function response(){let status=0,body:any;const res:any={setHeader:()=>{},status:(n:number)=>(status=n,res),json:(v:any)=>{body=v;}};return {res,get status(){return status;},get body(){return body;}};}

describe("painel automações",()=>{
  it("responde 401 sem JWT",async()=>{const s=setup(),r=response();await executarPainel({method:"POST",headers:{},body:{acao:"situacao"}} as any,r.res,s.deps);expect(r.status).toBe(401);});
  it("responde 403 para parceiro",async()=>{const s=setup({papel:"parceiro"}),r=response();await executarPainel({method:"POST",headers:{authorization:"Bearer jwt_teste"},body:{acao:"situacao"}} as any,r.res,s.deps);expect(r.status).toBe(403);});
  it("sincroniza contas preservando ativa e desativando as ausentes",async()=>{const s=setup({atuais:[{id:"conta_teste",ativa:true},{id:"conta_antiga",ativa:true}]}),r=response();await executarPainel({method:"POST",headers:{authorization:"Bearer jwt_teste"},body:{acao:"sincronizar-contas"}} as any,r.res,s.deps);expect(r.status).toBe(200);expect(s.writes[0].value[0].ativa).toBe(true);expect(s.writes[1].operation).toBe("update");expect(s.writes[1].value.ativa).toBe(false);});
});

describe("painel: contas fora do padrão",()=>{
  it("foto que não é https vira nula em vez de derrubar a sincronização",async()=>{
    const s=setup(),r=response();
    s.deps.contas=vi.fn(async()=>[{id:"conta_teste",usuario:"conta_teste",nome:null,foto:"http://exemplo.com/foto.jpg"}]);
    await executarPainel({method:"POST",headers:{authorization:"Bearer jwt_teste"},body:{acao:"sincronizar-contas"}} as any,r.res,s.deps);
    expect(r.status).toBe(200);
    expect(s.writes.find((w:any)=>w.operation==="upsert").value[0].foto).toBeNull();
  });
});
