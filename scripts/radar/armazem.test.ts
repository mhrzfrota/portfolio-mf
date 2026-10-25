import { describe, expect, it } from "vitest";
import { criarArmazem } from "./armazem.ts";
import { configTeste } from "./apoio-envio.ts";

type Row = Record<string, any>;
class Consulta {
  private operacao = "select";
  private dados: Row | Row[] = {};
  private filtros: [string, unknown][] = [];
  constructor(private readonly banco: Banco, private readonly tabela: string) {}
  select(_colunas: string) { return this; }
  update(dados: Row) { this.operacao = "update"; this.dados = dados; return this; }
  insert(dados: Row) { this.operacao = "insert"; this.dados = dados; return this; }
  upsert(dados: Row | Row[]) { this.operacao = "upsert"; this.dados = dados; return this; }
  delete() { this.operacao = "delete"; return this; }
  eq(campo: string, valor: unknown) { this.filtros.push([campo, valor]); return this; }
  async maybeSingle() { const r = await this.executar(); return { ...r, data: Array.isArray(r.data) ? r.data[0] ?? null : r.data }; }
  single() { return this.maybeSingle(); }
  then(resolve: (v: any) => unknown, reject?: (e: unknown) => unknown) { return this.executar().then(resolve, reject); }
  private async executar(): Promise<{ data: Row[] | Row | null; error: { code?: string; message: string } | null }> {
    let rows = this.banco.tabelas.get(this.tabela);
    if (!rows) return { data: null, error: { code: "PGRST205", message: "tabela ausente" } };
    const primario = this.tabela === "radar_config" ? "owner" : this.tabela === "radar_funil" ? "lead_id" : this.tabela === "radar_descartados" ? "chave" : this.tabela === "radar_bloqueados" ? "usuario" : "id";
    let achados = rows.filter((r) => this.filtros.every(([k,v]) => r[k] === v));
    if (this.operacao === "select") return { data: achados, error: null };
    if (this.operacao === "delete") { this.banco.tabelas.set(this.tabela, rows.filter((r) => !achados.includes(r))); return { data: achados, error: null }; }
    if (this.operacao === "update") {
      this.banco.antesUpdate?.(this.tabela, rows);
      achados = rows.filter((r) => this.filtros.every(([k,v]) => r[k] === v));
      for (const r of achados) { Object.assign(r, this.dados); if ("versao" in r) r.versao++; }
      return { data: achados, error: null };
    }
    const itens = (Array.isArray(this.dados) ? this.dados : [this.dados]).map((x) => ({ ...x }));
    for (const item of itens) {
      const existente = rows.find((r) => r.owner === item.owner && r[primario] === item[primario]);
      if (existente && this.operacao === "insert") return { data: null, error: { code: "23505", message: "duplicate" } };
      if (existente) { Object.assign(existente, item); if ("versao" in existente) existente.versao++; }
      else rows.push({ ...item, ...(this.tabela === "radar_envios" || this.tabela === "radar_funil" || this.tabela === "radar_config" ? { versao: 1 } : {}) });
    }
    return { data: itens, error: null };
  }
}
type Banco = { tabelas: Map<string, Row[]>; antesUpdate?: (tabela: string, rows: Row[]) => void };
function clienteFake(banco: Banco) { return { from: (tabela: string) => new Consulta(banco, tabela) }; }
function bancoBase(): Banco { return { tabelas: new Map([
  ["radar_leads", []], ["radar_envios", []], ["radar_funil", []], ["radar_bloqueados", []], ["radar_descartados", []],
  ["radar_config", [{ owner: "dono-teste", dados: configTeste(), versao: 4 }]],
]) }; }

describe("armazém Supabase", () => {
  it("carimba as alterações de configuração com CAS e preserva o dono", async () => {
    const banco = bancoBase();
    const armazem = criarArmazem(clienteFake(banco), "dono-teste");
    await armazem.alterarEstado((estado) => ({ ...estado, config: { ...estado.config, envio: { ...estado.config.envio, pausado: true } } }));
    const linha = banco.tabelas.get("radar_config")![0];
    expect(linha.owner).toBe("dono-teste");
    expect(linha.versao).toBe(5);
    expect(linha.dados.envio.pausado).toBe(true);
  });
  it("recarrega e reaplica a ação uma vez após conflito de versão", async () => {
    const banco = bancoBase();
    let conflitoUmaVez = true;
    banco.antesUpdate = (tabela, rows) => { if (tabela === "radar_config" && conflitoUmaVez) { rows[0].versao++; conflitoUmaVez = false; } };
    const armazem = criarArmazem(clienteFake(banco), "dono-teste");
    let aplicacoes = 0;
    await armazem.alterarEstado((estado) => { aplicacoes++; return { ...estado, config: { ...estado.config, envio: { ...estado.config.envio, pausado: true } } }; });
    expect(aplicacoes).toBe(2);
    expect(banco.tabelas.get("radar_config")![0].dados.envio.pausado).toBe(true);
  });
});
