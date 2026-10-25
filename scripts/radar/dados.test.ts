import { test } from "vitest";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DOMINIOS_NAO_PROPRIOS, dominioDe, nomeChave, normalizarInstagram, plataformaDeLinkBio, telefoneDe } from "../../shared/radar/normalizar.ts";
import { acharDuplicado, buscarTermo, chavesDoDescartado, chavesDoLead } from "../../shared/radar/dedup.ts";
import { validarDescartado, validarLead } from "../../shared/radar/validar.ts";
import type { Descartado, Lead } from "../../shared/radar/tipos.ts";

const hoje = "2026-10-19";
function exemplo(): Lead { return JSON.parse(readFileSync(new URL("./fixtures/lead-exemplo.json", import.meta.url), "utf8")) as Lead; }
function leadValido(): Lead {
  const resultado = validarLead(exemplo(), hoje);
  if (!resultado.ok) throw new Error(resultado.erros.join("\n"));
  return resultado.lead;
}
function reprova(entrada: unknown, campo: string, data = hoje): void {
  const resultado = validarLead(entrada, data);
  assert.equal(resultado.ok, false, campo);
  if (!resultado.ok) assert.ok(resultado.erros.some((erro) => erro.startsWith(`${campo}:`)), resultado.erros.join("\n"));
}

test("normalização: Instagram, domínios, bio, telefone e nome", () => {
  for (const forma of ["@Fulano", "fulano/", "instagram.com/fulano", "https://www.instagram.com/Fulano/?igsh=xx"]) assert.equal(normalizarInstagram(forma), "fulano");
  assert.equal(dominioDe("https://WWW.example.com/pagina?q=x"), "example.com");
  assert.equal(dominioDe("company.example/"), "company.example");
  for (const dominio of DOMINIOS_NAO_PROPRIOS) {
    assert.equal(dominioDe(`https://${dominio}/x`), undefined);
    assert.equal(dominioDe(`https://sub.${dominio}/x`), undefined);
  }
  assert.equal(dominioDe("https://naolinktr.ee"), "naolinktr.ee");
  assert.equal(dominioDe("não é uma url"), undefined);
  assert.equal(plataformaDeLinkBio("https://linktr.ee/exemplo"), "Linktree");
  assert.equal(plataformaDeLinkBio("https://api.whatsapp.com/send?phone=5500000000000"), "WhatsApp");
  assert.equal(plataformaDeLinkBio("https://beacons.ai/exemplo"), "Beacons");
  assert.equal(plataformaDeLinkBio("https://company.example"), undefined);
  assert.equal(telefoneDe("+55 (00) 00000-0000"), "00000000000");
  assert.equal(telefoneDe("+55 (00) 0000-0000"), "0000000000");
  assert.equal(telefoneDe("(55) 99999-0000"), "55999990000");
  assert.equal(telefoneDe("99999-0000"), undefined);
  assert.equal(nomeChave("Negócio Fictício!", "São Luís"), "negocioficticio|saoluis");
});

test("deduplicação: Instagram, domínio, WhatsApp, nome e ignorarId", () => {
  const lead = leadValido();
  assert.equal(acharDuplicado({ instagram: { usuario: "https://www.instagram.com/LEAD_FICTICIO_001/", ultimoPost: "" } }, [lead], [])?.chave, "ig:lead_ficticio_001");
  assert.equal(acharDuplicado({ site: { url: "https://www.company.example/contato" } }, [lead], [])?.chave, "dom:company.example");
  assert.equal(acharDuplicado({ contato: { telefone: "+55 (00) 00000-0000" } }, [lead], [])?.chave, "tel:00000000000");
  assert.equal(acharDuplicado({ nome: "Negócio Fictício", cidade: "FORTALEZA" }, [lead], [])?.chave, "nome:negocioficticio|fortaleza");
  assert.equal(acharDuplicado(lead, [lead], [], lead.id), null);
  assert.deepEqual(chavesDoLead({ site: { url: "https://linktr.ee/x" }, instagram: { usuario: "", ultimoPost: "", linkBio: "https://wa.me/5500000000000" } }), []);
  const outro = { ...lead, id: "outro" };
  assert.equal(acharDuplicado(lead, [lead, outro], [], lead.id)?.id, "outro");
});

test("descartados bloqueiam e busca reconhece as quatro formas de termo", () => {
  const lead = leadValido();
  const d: Descartado = { instagram: "@Recusado", nome: "Recusado Fictício", cidade: "Fortaleza", site: "https://refused.example", telefone: "+55 (00) 0000-0001", motivo: "Sem atividade", data: hoje };
  assert.ok(chavesDoDescartado(d).includes("ig:recusado"));
  assert.equal(acharDuplicado({ site: { url: d.site } }, [], [d])?.onde, "descartado");
  assert.deepEqual(acharDuplicado({ site: { url: d.site } }, [], [d]), { onde: "descartado", id: d.instagram, chave: "dom:refused.example" });
  for (const termo of ["@LEAD_FICTICIO_001", "https://instagram.com/lead_ficticio_001/", "https://www.company.example", "+55 (00) 00000-0000", "Negócio"]) {
    const encontrados = buscarTermo(termo, [lead], [d]);
    assert.equal(encontrados.length, 1, termo);
    assert.equal(encontrados[0].id, lead.id);
  }
  assert.equal(buscarTermo("@recusado", [], [d])[0].motivo, "Sem atividade");
  assert.equal(buscarTermo("Recusado", [], [{ ...d, cidade: undefined }])[0].id, d.instagram);
  assert.deepEqual(buscarTermo("https://linktr.ee/nao-proprio", [lead], [d]), []);
  assert.deepEqual(buscarTermo(" ", [lead], [d]), []);
});

test("validação normaliza sem mutar a entrada e recalcula 80 pontos", () => {
  const entrada = exemplo();
  entrada.id = "ignorar";
  entrada.pontuacao = 999;
  entrada.criterios.presenca_web.ok = false;
  const antes = structuredClone(entrada);
  const resultado = validarLead(entrada, hoje);
  assert.equal(resultado.ok, true);
  if (!resultado.ok) return;
  assert.equal(resultado.lead.id, "lead_ficticio_001");
  assert.equal(resultado.lead.instagram.usuario, "lead_ficticio_001");
  assert.equal(resultado.lead.uf, "CE");
  assert.equal(resultado.lead.pontuacao, 80);
  assert.equal(resultado.lead.contato.whatsapp, "00000000000");
  assert.equal(resultado.lead.criterios.presenca_web.ok, true);
  assert.deepEqual(entrada, antes);
  const { analisadoEm: _data, ...semData } = entrada;
  const padrao = validarLead(semData, hoje);
  assert.ok(padrao.ok && padrao.lead.analisadoEm === hoje);
  entrada.criterios.presenca_web.nivel = "bom";
  const bom = validarLead(entrada, hoje);
  assert.ok(bom.ok && !bom.lead.criterios.presenca_web.ok && bom.lead.pontuacao === 60);
});

test("datas: limite de 30 dias, 31 dias, datas impossíveis e futuras", () => {
  const lead = exemplo();
  lead.instagram.ultimoPost = "2026-09-19";
  assert.equal(validarLead(lead, hoje).ok, true);
  lead.instagram.ultimoPost = "2026-09-18";
  const resultado = validarLead(lead, hoje);
  assert.ok(!resultado.ok && resultado.erros.includes("instagram.ultimoPost: último post há 31 dias. Descarte com pnpm radar:lead -- descartar"));
  for (const data of ["2026-02-30", "2026-2-01", "2026-10-20"]) {
    lead.instagram.ultimoPost = data;
    reprova(lead, "instagram.ultimoPost");
  }
  lead.instagram.ultimoPost = "2026-10-18";
  lead.analisadoEm = "2026-10-20";
  reprova(lead, "analisadoEm");
});

test("travessão é recusado em todos os campos de texto indicados", () => {
  const casos: [string, (lead: Lead) => void][] = [
    ["abordagem.mensagem", (l) => { l.abordagem.mensagem += "\u2014"; }],
    ["abordagem.followup", (l) => { l.abordagem.followup = "Texto\u2014teste"; }],
    ["oportunidade", (l) => { l.oportunidade += "\u2014"; }],
    ["problemas[0]", (l) => { l.problemas[0] += "\u2014"; }],
    ["concorrentes[0].observacao", (l) => { l.concorrentes![0].observacao += "\u2014"; }],
    ["criterios.crescimento.evidencia", (l) => { l.criterios.crescimento.evidencia += "\u2014"; }],
  ];
  for (const [campo, alterar] of casos) { const lead = exemplo(); alterar(lead); reprova(lead, campo); }
});

test("critérios exigem todos os ids, evidência, fonte e nível válidos", () => {
  const lead = exemplo();
  const { crescimento: _crescimento, ...incompletos } = lead.criterios;
  reprova({ ...lead, criterios: incompletos }, "criterios.crescimento");
  reprova({ ...lead, criterios: { ...lead.criterios, outro: {} } }, "criterios.outro");
  delete lead.criterios.valor_agregado.fonte;
  reprova(lead, "criterios.valor_agregado.fonte");
  lead.criterios.crescimento.evidencia = " ";
  reprova(lead, "criterios.crescimento.evidencia");
  delete lead.criterios.presenca_web.nivel;
  reprova(lead, "criterios.presenca_web.nivel");
  reprova({ ...exemplo(), analizadoEm: hoje }, "analizadoEm");
});

test("estruturas inválidas, contato, URLs, números, canais e limite da mensagem", () => {
  for (const valor of [null, [], "texto", 12]) reprova(valor, "lead");
  const casos: [string, (lead: Lead) => void][] = [
    ["nome", (l) => { l.nome = " "; }],
    ["uf", (l) => { l.uf = "ZZ"; }],
    ["contato", (l) => { l.contato = {}; }],
    ["contato.email", (l) => { l.contato.email = "não-email"; }],
    ["contato.whatsapp", (l) => { l.contato.whatsapp = "123"; }],
    ["problemas", (l) => { l.problemas = []; }],
    ["servicos[0]", (l) => { l.servicos = ["desconhecido" as Lead["servicos"][number]]; }],
    ["site.url", (l) => { l.site.url = "javascript:alert(1)"; }],
    ["instagram.linkBio", (l) => { l.instagram.linkBio = "ftp://company.example"; }],
    ["google.url", (l) => { l.google!.url = "sem-url"; }],
    ["fontes[0]", (l) => { l.fontes = [""]; }],
    ["fontes", (l) => { l.fontes = []; }],
    ["google.nota", (l) => { l.google!.nota = 5.1; }],
    ["google.avaliacoes", (l) => { l.google!.avaliacoes = -1; }],
    ["instagram.seguidores", (l) => { l.instagram.seguidores = 1.5; }],
    ["abordagem.canal", (l) => { delete l.contato.whatsapp; }],
    ["abordagem.canal", (l) => { l.abordagem.canal = "email"; delete l.contato.email; }],
    ["abordagem.mensagem", (l) => { l.abordagem.mensagem = "x".repeat(701); }],
  ];
  for (const [campo, alterar] of casos) { const lead = exemplo(); alterar(lead); reprova(lead, campo); }
  const limite = exemplo();
  limite.abordagem.mensagem = "x".repeat(700);
  assert.equal(validarLead(limite, hoje).ok, true);
});

test("validação de descartado normaliza e exige Instagram, motivo e data real", () => {
  const resultado = validarDescartado({ instagram: "https://instagram.com/RECUSADO/", motivo: "Sem atividade", uf: "ce", telefone: "+55 (00) 0000-0000" }, hoje);
  assert.ok(resultado.ok && resultado.descartado.instagram === "recusado" && resultado.descartado.data === hoje && resultado.descartado.uf === "CE" && resultado.descartado.telefone === "0000000000");
  assert.equal(validarDescartado({ instagram: "", motivo: "" }, hoje).ok, false);
  assert.equal(validarDescartado({ instagram: "recusado", motivo: "Sem atividade", data: "2026-02-30" }, hoje).ok, false);
});

test("existe acha @ com ponto escrito sem arroba", () => {
  const lead = leadValido();
  assert.equal(buscarTermo(lead.instagram.usuario, [lead], [])[0]?.id, lead.id);
});

test("página Carrd de botões conta como link de bio, não como site", () => {
  assert.equal(plataformaDeLinkBio("https://perfil-ficticio.carrd.co/"), "Carrd");
  assert.equal(dominioDe("https://perfil-ficticio.carrd.co/"), undefined);
});

test("encurtador e arte do Canva não viram domínio próprio na deduplicação", () => {
  for (const url of ["https://bit.ly/GeralSolar", "https://w.app/Studio903", "https://wa.link/evv7f3", "https://shre.ink/Arte", "https://www.canva.com/design/X/view"]) {
    assert.equal(dominioDe(url), undefined, url);
  }
  assert.equal(plataformaDeLinkBio("https://www.canva.com/design/X/view"), "Canva");
  const lead = leadValido();
  lead.instagram.linkBio = "https://bit.ly/outro";
  assert.equal(buscarTermo("bit.ly", [lead], []).length, 0);
});
