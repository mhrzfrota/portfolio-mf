import { readFileSync } from "node:fs";
import type { ConfigRadar, Envio, Lead } from "../../shared/radar/tipos.ts";
import type { EstadoEnvio } from "../../shared/radar/envio.ts";
import { validarLead } from "../../shared/radar/validar.ts";

export const AGORA = new Date("2026-10-23T13:00:00.000Z");
export function configTeste(): ConfigRadar {
  return {
    clienteIdeal: { descricao: "Negócio fictício", nichos: [], regioes: [], sinais: [], fora: [] },
    oferta: { primeira: "Proposta fictícia", followupDias: 3 },
    envio: { canal: "instagram", conta: "emefeservices", limiteDiario: 10, intervaloMinSeg: 180, intervaloMaxSeg: 480, janela: { inicio: "09:00", fim: "18:00" }, soDiasUteis: true, pausado: false, notaMinima: 70 },
  };
}
export function leadTeste(id = "lead_ficticio_001", nota = 80): Lead {
  const resultado = validarLead(JSON.parse(readFileSync(new URL("./fixtures/lead-exemplo.json", import.meta.url), "utf8")), "2026-10-23");
  if (!resultado.ok) throw new Error(resultado.erros.join("\n"));
  return { ...resultado.lead, id, nome: `Negócio Fictício ${id}`, instagram: { ...resultado.lead.instagram, usuario: id }, pontuacao: nota };
}
export function estadoTeste(): EstadoEnvio { return { leads: [leadTeste()], envios: [], registros: {}, bloqueados: [], config: configTeste() }; }
export function envioTeste(campos: Partial<Envio> = {}): Envio {
  return { id: "lead_ficticio_001:primeira", leadId: "lead_ficticio_001", destino: "lead_ficticio_001", tipo: "primeira", canal: "instagram", mensagem: "Mensagem fictícia", status: "rascunho", criadoEm: "2026-10-20T13:00:00.000Z", ...campos };
}
