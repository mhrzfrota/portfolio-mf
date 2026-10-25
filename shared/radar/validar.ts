import { CRITERIOS, DIAS_ATIVO, PONTOS_SITE, SERVICOS } from "./criterios.ts";
import { calcularPontuacao } from "./pontuacao.ts";
import { normalizarInstagram, telefoneDe } from "./normalizar.ts";
import type { Descartado, Lead } from "./tipos.ts";

const UFS = new Set("AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" "));
const CAMPOS = new Set("id nome segmento cidade uf instagram site google contato decisor problemas oportunidade servicos criterios concorrentes abordagem pontuacao analisadoEm fontes".split(" "));
type Objeto = Record<string, unknown>;
const objeto = (valor: unknown): valor is Objeto => typeof valor === "object" && valor !== null && !Array.isArray(valor);

export function dataValida(valor: unknown): valor is string {
  return typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor) &&
    Number.isFinite(Date.parse(`${valor}T00:00:00Z`)) && new Date(`${valor}T00:00:00Z`).toISOString().slice(0, 10) === valor;
}

function verificacoes(erros: string[]) {
  const texto = (valor: unknown, campo: string, obrigatorio = true, semTravessao = false) => {
    if (valor === undefined && !obrigatorio) return;
    if (typeof valor !== "string" || !valor.trim()) erros.push(`${campo}: informe um texto não vazio`);
    if (semTravessao && typeof valor === "string" && valor.includes("\u2014")) erros.push(`${campo}: travessão proibido`);
  };
  const url = (valor: unknown, campo: string, obrigatorio = false) => {
    if (valor === undefined && !obrigatorio) return;
    try {
      if (typeof valor !== "string" || !/^https?:\/\//i.test(valor)) throw new Error();
      const parsed = new URL(valor);
      if (!parsed.hostname || !["http:", "https:"].includes(parsed.protocol) || /\s/.test(valor)) throw new Error();
    } catch { erros.push(`${campo}: informe uma URL http(s) válida`); }
  };
  const data = (valor: unknown, campo: string) => { if (!dataValida(valor)) erros.push(`${campo}: informe uma data real no formato AAAA-MM-DD`); };
  const inteiro = (valor: unknown, campo: string) => {
    if (valor !== undefined && (typeof valor !== "number" || !Number.isInteger(valor) || valor < 0)) erros.push(`${campo}: informe um inteiro maior ou igual a zero`);
  };
  const registro = (valor: unknown, campo: string): Objeto => {
    if (!objeto(valor)) { erros.push(`${campo}: informe um objeto`); return {}; }
    return { ...valor };
  };
  const telefone = (valor: unknown, campo: string): string | undefined => {
    if (valor === undefined) return undefined;
    const normalizado = typeof valor === "string" ? telefoneDe(valor) : undefined;
    if (!normalizado) erros.push(`${campo}: informe um telefone com pelo menos 10 dígitos`);
    return normalizado;
  };
  return { texto, url, data, inteiro, registro, telefone };
}

export function validarLead(entrada: unknown, hoje: string): { ok: true; lead: Lead } | { ok: false; erros: string[] } {
  const erros: string[] = [];
  const v = verificacoes(erros);
  const lead = v.registro(entrada, "lead");
  for (const campo of Object.keys(lead)) if (!CAMPOS.has(campo)) erros.push(`${campo}: campo desconhecido`);
  for (const campo of ["nome", "segmento", "cidade"]) v.texto(lead[campo], campo);
  v.texto(lead.oportunidade, "oportunidade", true, true);
  v.texto(lead.decisor, "decisor", false);
  lead.uf = typeof lead.uf === "string" ? lead.uf.trim().toUpperCase() : lead.uf;
  if (typeof lead.uf !== "string" || !UFS.has(lead.uf)) erros.push("uf: informe uma das 27 UFs");
  const instagram = v.registro(lead.instagram, "instagram");
  const usuario = typeof instagram.usuario === "string" ? normalizarInstagram(instagram.usuario) : "";
  if (!/^[a-z0-9._]{1,30}$/.test(usuario)) erros.push("instagram.usuario: informe um usuário válido do Instagram");
  instagram.usuario = usuario;
  lead.id = usuario;
  lead.instagram = instagram;
  v.inteiro(instagram.seguidores, "instagram.seguidores");
  v.inteiro(instagram.postsUltimos30Dias, "instagram.postsUltimos30Dias");
  v.texto(instagram.bio, "instagram.bio", false);
  v.url(instagram.linkBio, "instagram.linkBio");
  if (lead.analisadoEm === undefined) lead.analisadoEm = hoje;
  v.data(hoje, "hoje");
  v.data(lead.analisadoEm, "analisadoEm");
  v.data(instagram.ultimoPost, "instagram.ultimoPost");
  if (dataValida(lead.analisadoEm) && dataValida(hoje) && lead.analisadoEm > hoje) erros.push("analisadoEm: não pode passar de hoje");
  if (dataValida(instagram.ultimoPost) && dataValida(lead.analisadoEm)) {
    const dias = Math.round((Date.parse(lead.analisadoEm) - Date.parse(instagram.ultimoPost)) / 86_400_000);
    if (dias < 0) erros.push("instagram.ultimoPost: não pode passar de analisadoEm");
    if (dias > DIAS_ATIVO) erros.push(`instagram.ultimoPost: último post há ${dias} dias. Descarte com pnpm radar:lead -- descartar`);
  }
  const site = v.registro(lead.site, "site");
  v.url(site.url, "site.url");
  lead.site = site;
  const contato = v.registro(lead.contato, "contato");
  for (const campo of ["whatsapp", "telefone"]) {
    if (contato[campo] !== undefined) contato[campo] = v.telefone(contato[campo], `contato.${campo}`);
  }
  if (contato.email !== undefined) {
    if (typeof contato.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contato.email.trim())) erros.push("contato.email: informe um email válido");
    else contato.email = contato.email.trim();
  }
  if (!contato.whatsapp && !contato.telefone && !contato.email) erros.push("contato: informe whatsapp, telefone ou email");
  lead.contato = contato;
  if (lead.google !== undefined) {
    const google = v.registro(lead.google, "google");
    if (google.nota !== undefined && (typeof google.nota !== "number" || !Number.isFinite(google.nota) || google.nota < 0 || google.nota > 5)) erros.push("google.nota: deve estar entre 0 e 5");
    v.inteiro(google.avaliacoes, "google.avaliacoes");
    v.url(google.url, "google.url");
  }
  for (const campo of ["problemas", "servicos", "fontes"]) {
    const itens = lead[campo];
    if (!Array.isArray(itens) || itens.length === 0) { erros.push(`${campo}: informe pelo menos um item`); continue; }
    itens.forEach((item, i) => {
      if (campo === "problemas") v.texto(item, `${campo}[${i}]`, true, true);
      if (campo === "fontes") v.url(item, `${campo}[${i}]`, true);
      if (campo === "servicos" && (typeof item !== "string" || !Object.hasOwn(SERVICOS, item))) erros.push(`${campo}[${i}]: serviço desconhecido`);
    });
  }
  const criterios = v.registro(lead.criterios, "criterios");
  const ids = new Set<string>(CRITERIOS.map(({ id }) => id));
  for (const id of Object.keys(criterios)) if (!ids.has(id)) erros.push(`criterios.${id}: critério desconhecido`);
  for (const { id } of CRITERIOS) {
    const campo = `criterios.${id}`;
    const criterio = v.registro(criterios[id], campo);
    if (typeof criterio.ok !== "boolean") erros.push(`${campo}.ok: informe um booleano`);
    if (id === "presenca_web") {
      if (typeof criterio.nivel !== "string" || !Object.hasOwn(PONTOS_SITE, criterio.nivel)) erros.push(`${campo}.nivel: nível obrigatório e válido`);
      else criterio.ok = criterio.nivel !== "bom";
    }
    v.texto(criterio.evidencia, `${campo}.evidencia`, true, true);
    v.url(criterio.fonte, `${campo}.fonte`, criterio.ok === true);
    criterios[id] = criterio;
  }
  lead.criterios = criterios;
  const abordagem = v.registro(lead.abordagem, "abordagem");
  if (!["whatsapp", "instagram", "email"].includes(String(abordagem.canal))) erros.push("abordagem.canal: use whatsapp, instagram ou email");
  if (abordagem.canal === "whatsapp" && !contato.whatsapp) erros.push("abordagem.canal: whatsapp exige contato.whatsapp");
  if (abordagem.canal === "email" && !contato.email) erros.push("abordagem.canal: email exige contato.email");
  v.texto(abordagem.mensagem, "abordagem.mensagem", true, true);
  v.texto(abordagem.followup, "abordagem.followup", false, true);
  if (typeof abordagem.mensagem === "string" && abordagem.mensagem.length > 700) erros.push("abordagem.mensagem: máximo de 700 caracteres");
  if (lead.concorrentes !== undefined) {
    if (!Array.isArray(lead.concorrentes)) erros.push("concorrentes: informe uma lista");
    else lead.concorrentes.forEach((item, i) => {
      const concorrente = v.registro(item, `concorrentes[${i}]`);
      v.texto(concorrente.nome, `concorrentes[${i}].nome`);
      v.url(concorrente.site, `concorrentes[${i}].site`, true);
      v.texto(concorrente.observacao, `concorrentes[${i}].observacao`, true, true);
    });
  }
  if (erros.length) return { ok: false, erros };
  const validado = lead as unknown as Lead;
  validado.pontuacao = calcularPontuacao(validado.criterios);
  return { ok: true, lead: validado };
}

export function validarDescartado(entrada: unknown, hoje: string): { ok: true; descartado: Descartado } | { ok: false; erros: string[] } {
  const erros: string[] = [];
  const v = verificacoes(erros);
  const d = v.registro(entrada, "descartado");
  d.instagram = typeof d.instagram === "string" ? normalizarInstagram(d.instagram) : "";
  if (typeof d.instagram !== "string" || !/^[a-z0-9._]{1,30}$/.test(d.instagram)) erros.push("instagram: informe um usuário válido do Instagram");
  v.texto(d.motivo, "motivo");
  if (d.data === undefined) d.data = hoje;
  v.data(d.data, "data");
  for (const campo of ["nome", "cidade"]) v.texto(d[campo], campo, false);
  if (d.uf !== undefined) {
    d.uf = typeof d.uf === "string" ? d.uf.trim().toUpperCase() : d.uf;
    if (typeof d.uf !== "string" || !UFS.has(d.uf)) erros.push("uf: informe uma das 27 UFs");
  }
  v.url(d.site, "site");
  if (d.telefone !== undefined) d.telefone = v.telefone(d.telefone, "telefone");
  return erros.length ? { ok: false, erros } : { ok: true, descartado: d as unknown as Descartado };
}
