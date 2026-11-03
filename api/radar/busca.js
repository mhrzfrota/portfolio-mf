// Gerado por pnpm build:api a partir de server/radar/busca.ts. Não edite.

// server/radar/busca.ts
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// shared/radar/buscas.ts
var LIMITES_BUSCA = {
  rapida: { quantidade: 10, porDia: 5 },
  completa: { quantidade: 15, porDia: 2 }
};
function validarPedidoBusca(modo, entrada) {
  const x = entrada;
  const nicho = typeof x?.nicho === "string" ? x.nicho.trim() : "";
  const regiao = typeof x?.regiao === "string" ? x.regiao.trim() : "";
  const quantidade = Number(x?.quantidade);
  if (nicho.length < 2 || nicho.length > 100)
    throw new Error("Nicho deve ter entre 2 e 100 caracteres.");
  if (regiao.length < 2 || regiao.length > 120)
    throw new Error("Regi\xE3o deve ter entre 2 e 120 caracteres.");
  if (!Number.isSafeInteger(quantidade) || quantidade < 1 || quantidade > LIMITES_BUSCA[modo].quantidade)
    throw new Error(
      `Quantidade deve ficar entre 1 e ${LIMITES_BUSCA[modo].quantidade}.`
    );
  return { modo, nicho, regiao, quantidade };
}

// shared/radar/normalizar.ts
var DOMINIOS_NAO_PROPRIOS = [
  "instagram.com",
  "facebook.com",
  "fb.com",
  "wa.me",
  "api.whatsapp.com",
  "whatsapp.com",
  "linktr.ee",
  "beacons.ai",
  "bio.link",
  "linkin.bio",
  "taplink.cc",
  "campsite.bio",
  "lnk.bio",
  "msha.ke",
  "linkbio.co",
  "carrd.co",
  "bio.site",
  "solo.to",
  "linklist.bio",
  "canva.com",
  // Encurtadores: o destino é que diz se há site; o encurtador em si é de todo mundo
  "bit.ly",
  "w.app",
  "wa.link",
  "shre.ink",
  "trakto.link",
  "tinyurl.com",
  "cutt.ly",
  "encurtador.com.br",
  "abre.ai",
  "google.com",
  "g.page",
  "goo.gl",
  "maps.app.goo.gl",
  "youtube.com",
  "tiktok.com"
];
function hostDe(valor) {
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(valor.trim()) ? valor.trim() : `https://${valor.trim()}`);
    if (!/^https?:$/.test(url.protocol)) return void 0;
    return url.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  } catch {
    return void 0;
  }
}
function pertence(host, dominio) {
  return host === dominio || host.endsWith(`.${dominio}`);
}
function normalizarInstagram(s) {
  let valor = s.trim().toLowerCase();
  if (/^(?:https?:\/\/)?(?:[\w-]+\.)*instagram\.com(?:\/|$)/i.test(valor)) {
    try {
      const url = new URL(/^https?:\/\//.test(valor) ? valor : `https://${valor}`);
      valor = url.pathname.replace(/^\/+/, "");
    } catch {
      return "";
    }
  } else if (valor.includes("://")) return "";
  return valor.replace(/^@+/, "").split(/[/?#]/, 1)[0];
}
function dominioDe(url) {
  const host = hostDe(url);
  if (!host || DOMINIOS_NAO_PROPRIOS.some((dominio) => pertence(host, dominio))) return void 0;
  return host;
}
function plataformaDeLinkBio(url) {
  if (/^whatsapp:\/\//i.test(url.trim())) return "WhatsApp";
  const host = hostDe(url);
  if (!host) return void 0;
  const plataformas = {
    "wa.me": "WhatsApp",
    "whatsapp.com": "WhatsApp",
    "linktr.ee": "Linktree",
    "beacons.ai": "Beacons",
    "bio.link": "Bio.link",
    "linkin.bio": "Linkin.bio",
    "taplink.cc": "Taplink",
    "campsite.bio": "Campsite",
    "lnk.bio": "Lnk.Bio",
    "msha.ke": "Milkshake",
    "linkbio.co": "Linkbio",
    // Página de botões num subdomínio gratuito: visual pode ser bonito, mas não é site
    "carrd.co": "Carrd",
    "bio.site": "Bio Site",
    "solo.to": "Solo.to",
    "linklist.bio": "Linklist",
    "canva.com": "Canva"
  };
  return Object.entries(plataformas).find(([dominio]) => pertence(host, dominio))?.[1];
}
function telefoneDe(s) {
  let digitos = s.replace(/\D/g, "");
  if (digitos.startsWith("55") && (digitos.length === 12 || digitos.length === 13)) digitos = digitos.slice(2);
  return digitos.length >= 10 ? digitos : void 0;
}
function nomeChave(nome, cidade) {
  const limpar = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  return `${limpar(nome)}|${limpar(cidade)}`;
}

// shared/radar/dedup.ts
function chavesDoLead(lead) {
  const chaves = /* @__PURE__ */ new Set();
  const adicionar = (prefixo, valor) => {
    if (valor) chaves.add(`${prefixo}:${valor}`);
  };
  adicionar(
    "ig",
    lead.instagram?.usuario ? normalizarInstagram(lead.instagram.usuario) : void 0
  );
  adicionar("dom", lead.site?.url ? dominioDe(lead.site.url) : void 0);
  adicionar(
    "dom",
    lead.instagram?.linkBio ? dominioDe(lead.instagram.linkBio) : void 0
  );
  adicionar(
    "tel",
    lead.contato?.whatsapp ? telefoneDe(lead.contato.whatsapp) : void 0
  );
  adicionar(
    "tel",
    lead.contato?.telefone ? telefoneDe(lead.contato.telefone) : void 0
  );
  const nome = nomeChave(lead.nome ?? "", lead.cidade ?? "");
  if (nome.split("|").every(Boolean)) adicionar("nome", nome);
  return [...chaves];
}
function chavesDoDescartado(d) {
  return chavesDoLead({
    nome: d.nome,
    cidade: d.cidade,
    instagram: d.instagram ? { usuario: d.instagram, ultimoPost: "" } : void 0,
    site: { url: d.site },
    contato: { telefone: d.telefone }
  });
}
function casos(leads, descartados) {
  return [
    ...leads.flatMap(
      (lead) => chavesDoLead(lead).map((chave) => ({
        onde: "lead",
        id: lead.id,
        chave
      }))
    ),
    ...descartados.flatMap(
      (d) => chavesDoDescartado(d).map((chave) => ({
        onde: "descartado",
        id: d.instagram,
        chave,
        motivo: d.motivo
      }))
    )
  ];
}
function acharDuplicado(candidato, leads, descartados, ignorarId) {
  const chaves = new Set(chavesDoLead(candidato));
  const encontrado = casos(leads, descartados).find(
    (caso) => !(caso.onde === "lead" && caso.id === ignorarId) && chaves.has(caso.chave)
  );
  return encontrado ? { onde: encontrado.onde, id: encontrado.id, chave: encontrado.chave } : null;
}

// shared/radar/criterios.ts
var SERVICOS = {
  site: "Site institucional",
  "landing-page": "Landing page",
  "pagina-de-vendas": "P\xE1gina de vendas",
  vsl: "VSL",
  catalogo: "Cat\xE1logo",
  "loja-online": "Loja online"
};
var PONTOS_SITE = {
  "sem-site": 25,
  ruim: 20,
  mediano: 10,
  bom: 0
};
var CRITERIOS = [
  {
    id: "presenca_web",
    bloco: "necessidade",
    nome: "Presen\xE7a na web",
    pontos: 25,
    regra: "Sem site pr\xF3prio (link da bio \xE9 WhatsApp, Linktree ou nada, e a busca pelo nome n\xE3o acha dom\xEDnio) = 25. Site ruim (2 ou mais: n\xE3o se adapta ao celular, lento, sem HTTPS, rodap\xE9 com ano antigo, fora do ar, visual amador) = 20. Site mediano (1 problema) = 10. Site bom = 0. Evid\xEAncia: sa\xEDda do diagn\xF3stico-site ou a busca feita."
  },
  {
    id: "so_insta_whats",
    bloco: "necessidade",
    nome: "Vende s\xF3 pelo Instagram ou WhatsApp",
    pontos: 10,
    regra: 'Pedido, or\xE7amento ou agendamento s\xF3 pelo direct ou WhatsApp ("chama no direct", "or\xE7amento pelo whats", cat\xE1logo nos destaques).'
  },
  {
    id: "concorrente_melhor",
    bloco: "necessidade",
    nome: "Concorrente com site melhor",
    pontos: 10,
    regra: "Concorrente direto, na mesma cidade e segmento, com site claramente melhor. Evid\xEAncia: o site do concorrente."
  },
  {
    id: "investe_divulgacao",
    bloco: "capacidade",
    nome: "Investe em divulga\xE7\xE3o",
    pontos: 10,
    regra: "An\xFAncio ativo na Biblioteca de An\xFAncios do Meta, ou foto e v\xEDdeo de produ\xE7\xE3o profissional, ou parceria paga com influenciador."
  },
  {
    id: "frequencia_posts",
    bloco: "capacidade",
    nome: "Posta com frequ\xEAncia",
    pontos: 5,
    regra: "8 posts ou mais nos \xFAltimos 30 dias (reels contam)."
  },
  {
    id: "boas_avaliacoes",
    bloco: "capacidade",
    nome: "Boas avalia\xE7\xF5es no Google",
    pontos: 10,
    regra: "Nota 4,5 ou mais com pelo menos 30 avalia\xE7\xF5es no Google. Evid\xEAncia: link do Google Maps."
  },
  {
    id: "valor_agregado",
    bloco: "capacidade",
    nome: "Servi\xE7o de valor agregado",
    pontos: 10,
    regra: "Ticket m\xE9dio alto: cl\xEDnica, est\xE9tica, odontologia, advocacia, arquitetura, imobili\xE1ria, escola, turismo, evento, mentoria, curso, ve\xEDculo."
  },
  {
    id: "crescimento",
    bloco: "capacidade",
    nome: "Em crescimento",
    pontos: 10,
    regra: "Nova unidade, servi\xE7o novo, inaugura\xE7\xE3o, contratando ou lan\xE7amento nos \xFAltimos 90 dias. Evid\xEAncia: o post ou a not\xEDcia."
  },
  {
    id: "porte_ideal",
    bloco: "acesso",
    nome: "Porte ideal",
    pontos: 5,
    regra: "Entre 1 mil e 100 mil seguidores: grande o bastante para pagar, pequeno o bastante para n\xE3o ter ag\xEAncia."
  },
  {
    id: "decisor_identificado",
    bloco: "acesso",
    nome: "Decisor identificado",
    pontos: 5,
    regra: "Nome do dono ou s\xF3cio aparece no perfil, no site ou nos posts."
  }
];
var FAIXAS = {
  quente: { nome: "Quente", minimo: 70 },
  morno: { nome: "Morno", minimo: 50 },
  frio: { nome: "Frio", minimo: 0 }
};
function faixaDa(pontuacao) {
  if (pontuacao >= FAIXAS.quente.minimo) return "quente";
  if (pontuacao >= FAIXAS.morno.minimo) return "morno";
  return "frio";
}
var DIAS_ATIVO = 30;

// shared/radar/pontuacao.ts
function pontosDe(criterio2, avaliacao) {
  if (!avaliacao?.ok || !avaliacao.evidencia?.trim() || !avaliacao.fonte?.trim()) return 0;
  if (criterio2.id === "presenca_web") return avaliacao.nivel ? PONTOS_SITE[avaliacao.nivel] : 0;
  return criterio2.pontos;
}
function detalharPontuacao(criterios) {
  return CRITERIOS.map((criterio2) => {
    const avaliacao = criterios[criterio2.id];
    return { criterio: criterio2, avaliacao, obtidos: pontosDe(criterio2, avaliacao) };
  });
}
function calcularPontuacao(criterios) {
  return detalharPontuacao(criterios).reduce((soma, parcela) => soma + parcela.obtidos, 0);
}

// shared/radar/validar.ts
var UFS = new Set(
  "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(
    " "
  )
);
var CAMPOS = new Set(
  "id origem nome segmento cidade uf instagram site google contato decisor problemas oportunidade servicos criterios concorrentes abordagem pontuacao analisadoEm fontes".split(
    " "
  )
);
var objeto = (valor) => typeof valor === "object" && valor !== null && !Array.isArray(valor);
function dataValida(valor) {
  return typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor) && Number.isFinite(Date.parse(`${valor}T00:00:00Z`)) && (/* @__PURE__ */ new Date(`${valor}T00:00:00Z`)).toISOString().slice(0, 10) === valor;
}
function verificacoes(erros) {
  const texto = (valor, campo, obrigatorio = true, semTravessao = false) => {
    if (valor === void 0 && !obrigatorio) return;
    if (typeof valor !== "string" || !valor.trim())
      erros.push(`${campo}: informe um texto n\xE3o vazio`);
    if (semTravessao && typeof valor === "string" && valor.includes("\u2014"))
      erros.push(`${campo}: travess\xE3o proibido`);
  };
  const url = (valor, campo, obrigatorio = false) => {
    if (valor === void 0 && !obrigatorio) return;
    try {
      if (typeof valor !== "string" || !/^https?:\/\//i.test(valor))
        throw new Error();
      const parsed = new URL(valor);
      if (!parsed.hostname || !["http:", "https:"].includes(parsed.protocol) || /\s/.test(valor))
        throw new Error();
    } catch {
      erros.push(`${campo}: informe uma URL http(s) v\xE1lida`);
    }
  };
  const data = (valor, campo) => {
    if (!dataValida(valor))
      erros.push(`${campo}: informe uma data real no formato AAAA-MM-DD`);
  };
  const inteiro = (valor, campo) => {
    if (valor !== void 0 && (typeof valor !== "number" || !Number.isInteger(valor) || valor < 0))
      erros.push(`${campo}: informe um inteiro maior ou igual a zero`);
  };
  const registro = (valor, campo) => {
    if (!objeto(valor)) {
      erros.push(`${campo}: informe um objeto`);
      return {};
    }
    return { ...valor };
  };
  const telefone = (valor, campo) => {
    if (valor === void 0) return void 0;
    const normalizado = typeof valor === "string" ? telefoneDe(valor) : void 0;
    if (!normalizado)
      erros.push(`${campo}: informe um telefone com pelo menos 10 d\xEDgitos`);
    return normalizado;
  };
  return { texto, url, data, inteiro, registro, telefone };
}
function validarLead(entrada, hoje2) {
  const erros = [];
  const v = verificacoes(erros);
  const lead = v.registro(entrada, "lead");
  for (const campo of Object.keys(lead))
    if (!CAMPOS.has(campo)) erros.push(`${campo}: campo desconhecido`);
  for (const campo of ["nome", "segmento", "cidade"])
    v.texto(lead[campo], campo);
  v.texto(lead.oportunidade, "oportunidade", true, true);
  v.texto(lead.decisor, "decisor", false);
  lead.uf = typeof lead.uf === "string" ? lead.uf.trim().toUpperCase() : lead.uf;
  if (typeof lead.uf !== "string" || !UFS.has(lead.uf))
    erros.push("uf: informe uma das 27 UFs");
  if (lead.origem !== void 0 && !["agente", "rapida"].includes(String(lead.origem)))
    erros.push("origem: use agente ou rapida");
  const rapida = lead.origem === "rapida";
  const instagram = lead.instagram === void 0 && rapida ? void 0 : v.registro(lead.instagram, "instagram");
  const usuario = instagram && typeof instagram.usuario === "string" ? normalizarInstagram(instagram.usuario) : "";
  if (!rapida || instagram) {
    if (!/^[a-z0-9._]{1,30}$/.test(usuario))
      erros.push("instagram.usuario: informe um usu\xE1rio v\xE1lido do Instagram");
    if (instagram) {
      instagram.usuario = usuario;
      lead.id = usuario;
      lead.instagram = instagram;
      v.inteiro(instagram.seguidores, "instagram.seguidores");
      v.inteiro(instagram.postsUltimos30Dias, "instagram.postsUltimos30Dias");
      v.texto(instagram.bio, "instagram.bio", false);
      v.url(instagram.linkBio, "instagram.linkBio");
    }
  } else {
    if (typeof lead.id !== "string" || !/^g-[a-z0-9]{8,64}$/.test(lead.id))
      erros.push("id: lead r\xE1pido sem Instagram exige id g-<hash>");
  }
  if (lead.analisadoEm === void 0) lead.analisadoEm = hoje2;
  v.data(hoje2, "hoje");
  v.data(lead.analisadoEm, "analisadoEm");
  if (instagram?.ultimoPost)
    v.data(instagram.ultimoPost, "instagram.ultimoPost");
  else if (!rapida)
    erros.push(
      "instagram.ultimoPost: informe uma data real no formato AAAA-MM-DD"
    );
  if (dataValida(lead.analisadoEm) && dataValida(hoje2) && lead.analisadoEm > hoje2)
    erros.push("analisadoEm: n\xE3o pode passar de hoje");
  if (instagram && dataValida(instagram.ultimoPost) && dataValida(lead.analisadoEm)) {
    const dias = Math.round(
      (Date.parse(lead.analisadoEm) - Date.parse(instagram.ultimoPost)) / 864e5
    );
    if (dias < 0)
      erros.push("instagram.ultimoPost: n\xE3o pode passar de analisadoEm");
    if (dias > DIAS_ATIVO)
      erros.push(
        `instagram.ultimoPost: \xFAltimo post h\xE1 ${dias} dias. Descarte com pnpm radar:lead -- descartar`
      );
  }
  const site = v.registro(lead.site, "site");
  v.url(site.url, "site.url");
  lead.site = site;
  const contato = v.registro(lead.contato, "contato");
  for (const campo of ["whatsapp", "telefone"]) {
    if (contato[campo] !== void 0)
      contato[campo] = v.telefone(contato[campo], `contato.${campo}`);
  }
  if (contato.email !== void 0) {
    if (typeof contato.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contato.email.trim()))
      erros.push("contato.email: informe um email v\xE1lido");
    else contato.email = contato.email.trim();
  }
  if (!contato.whatsapp && !contato.telefone && !contato.email)
    erros.push("contato: informe whatsapp, telefone ou email");
  lead.contato = contato;
  if (lead.google !== void 0) {
    const google = v.registro(lead.google, "google");
    if (google.nota !== void 0 && (typeof google.nota !== "number" || !Number.isFinite(google.nota) || google.nota < 0 || google.nota > 5))
      erros.push("google.nota: deve estar entre 0 e 5");
    v.inteiro(google.avaliacoes, "google.avaliacoes");
    v.url(google.url, "google.url");
  }
  for (const campo of ["problemas", "servicos", "fontes"]) {
    const itens = lead[campo];
    if (!Array.isArray(itens) || itens.length === 0) {
      erros.push(`${campo}: informe pelo menos um item`);
      continue;
    }
    itens.forEach((item, i) => {
      if (campo === "problemas") v.texto(item, `${campo}[${i}]`, true, true);
      if (campo === "fontes") v.url(item, `${campo}[${i}]`, true);
      if (campo === "servicos" && (typeof item !== "string" || !Object.hasOwn(SERVICOS, item)))
        erros.push(`${campo}[${i}]: servi\xE7o desconhecido`);
    });
  }
  const criterios = v.registro(lead.criterios, "criterios");
  const ids = new Set(CRITERIOS.map(({ id }) => id));
  for (const id of Object.keys(criterios))
    if (!ids.has(id)) erros.push(`criterios.${id}: crit\xE9rio desconhecido`);
  for (const { id } of CRITERIOS) {
    const campo = `criterios.${id}`;
    const criterio2 = v.registro(criterios[id], campo);
    if (typeof criterio2.ok !== "boolean")
      erros.push(`${campo}.ok: informe um booleano`);
    if (id === "presenca_web") {
      if (typeof criterio2.nivel !== "string" || !Object.hasOwn(PONTOS_SITE, criterio2.nivel))
        erros.push(`${campo}.nivel: n\xEDvel obrigat\xF3rio e v\xE1lido`);
      else criterio2.ok = criterio2.nivel !== "bom";
    }
    v.texto(criterio2.evidencia, `${campo}.evidencia`, true, true);
    v.url(criterio2.fonte, `${campo}.fonte`, criterio2.ok === true);
    criterios[id] = criterio2;
  }
  lead.criterios = criterios;
  const abordagem = v.registro(lead.abordagem, "abordagem");
  if (!["whatsapp", "instagram", "email"].includes(String(abordagem.canal)))
    erros.push("abordagem.canal: use whatsapp, instagram ou email");
  if (abordagem.canal === "whatsapp" && !contato.whatsapp)
    erros.push("abordagem.canal: whatsapp exige contato.whatsapp");
  if (abordagem.canal === "email" && !contato.email)
    erros.push("abordagem.canal: email exige contato.email");
  if (!(rapida && abordagem.mensagem === ""))
    v.texto(abordagem.mensagem, "abordagem.mensagem", !rapida, true);
  v.texto(abordagem.followup, "abordagem.followup", false, true);
  if (typeof abordagem.mensagem === "string" && abordagem.mensagem.length > 700)
    erros.push("abordagem.mensagem: m\xE1ximo de 700 caracteres");
  if (lead.concorrentes !== void 0) {
    if (!Array.isArray(lead.concorrentes))
      erros.push("concorrentes: informe uma lista");
    else
      lead.concorrentes.forEach((item, i) => {
        const concorrente = v.registro(item, `concorrentes[${i}]`);
        v.texto(concorrente.nome, `concorrentes[${i}].nome`);
        v.url(concorrente.site, `concorrentes[${i}].site`, true);
        v.texto(
          concorrente.observacao,
          `concorrentes[${i}].observacao`,
          true,
          true
        );
      });
  }
  if (erros.length) return { ok: false, erros };
  const validado = lead;
  validado.pontuacao = calcularPontuacao(validado.criterios);
  return { ok: true, lead: validado };
}

// shared/radar/site.ts
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
var MAX_REDIRECTS = 5;
var MAX_BYTES = 15e5;
var privadoV4 = (ip) => /^(?:10\.|127\.|169\.254\.|0\.|192\.168\.|(?:172\.(?:1[6-9]|2\d|3[01]))\.|100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/.test(
  ip
);
var privadoV6 = (ip) => ip === "::1" || ip === "::" || /^f[cd][0-9a-f]{2}:/i.test(ip) || /^fe[89ab][0-9a-f]:/i.test(ip) || /^::ffff:(?:10\.|127\.|169\.254\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/i.test(
  ip
);
function ipPublico(ip) {
  return isIP(ip) !== 0 && !(isIP(ip) === 4 ? privadoV4(ip) : privadoV6(ip));
}
async function validarDestino(url, resolver = lookup) {
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password)
    throw new Error("Site deve usar HTTP ou HTTPS.");
  if (url.port && !(url.protocol === "http:" && url.port === "80" || url.protocol === "https:" && url.port === "443"))
    throw new Error("Porta n\xE3o permitida.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const enderecos = isIP(host) ? [{ address: host }] : await resolver(host, { all: true });
  if (!enderecos.length || enderecos.some(({ address }) => !ipPublico(address)))
    throw new Error("Destino privado ou local n\xE3o permitido.");
}
async function fetchSeguro(endereco, deps = {}) {
  const chamar = deps.fetch ?? fetch, resolver = deps.resolver ?? lookup;
  let atual = new URL(endereco);
  for (let salto = 0; salto <= MAX_REDIRECTS; salto++) {
    await validarDestino(atual, resolver);
    const resposta = await chamar(atual, {
      redirect: "manual",
      signal: AbortSignal.timeout(8e3),
      headers: { "User-Agent": "Mozilla/5.0 RadarMF/1.0", Accept: "text/html" }
    });
    if ([301, 302, 303, 307, 308].includes(resposta.status)) {
      const local2 = resposta.headers.get("location");
      if (!local2 || salto === MAX_REDIRECTS)
        throw new Error("Redirecionamento inv\xE1lido ou excessivo.");
      atual = new URL(local2, atual);
      continue;
    }
    const tamanho = Number(resposta.headers.get("content-length") ?? 0);
    if (tamanho > MAX_BYTES) throw new Error("Site excede o tamanho m\xE1ximo.");
    const leitor = resposta.body?.getReader();
    const partes = [];
    let total = 0;
    if (leitor)
      while (true) {
        const { value, done } = await leitor.read();
        if (done) break;
        total += value.length;
        if (total > MAX_BYTES) {
          await leitor.cancel();
          throw new Error("Site excede o tamanho m\xE1ximo.");
        }
        partes.push(value);
      }
    return {
      resposta,
      html: Buffer.concat(partes).toString("utf8"),
      urlFinal: atual.toString(),
      bytes: total
    };
  }
  throw new Error("Redirecionamento excessivo.");
}
var NAO_PERFIL = /* @__PURE__ */ new Set(["p", "reel", "reels", "tv", "stories", "explore", "accounts", "share", "direct", "about", "legal", "developer", "instagram"]);
function extrairContatosHtml(html) {
  const ig = [...html.matchAll(/instagram\.com\/([a-z0-9._]{1,30})(?=[/?#"'\s<]|$)/gi)].map((m) => m[1].toLowerCase()).find((x) => !NAO_PERFIL.has(x) && !/^\.|\.$/.test(x));
  const wa = html.match(
    /(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=|whatsapp\.com\/send\?phone=)(\+?\d[\d(). +%-]{8,20})/i
  )?.[1]?.replace(/\D/g, "");
  return { instagram: ig, whatsapp: wa };
}
async function diagnosticarSiteSeguro(url, analisar) {
  const inicio = Date.now(), hoje2 = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza"
  }).format(/* @__PURE__ */ new Date());
  try {
    const { resposta, html, urlFinal, bytes } = await fetchSeguro(url);
    return {
      diagnostico: analisar(html, {
        url,
        urlFinal,
        status: resposta.status,
        tempoRespostaMs: Date.now() - inicio,
        tamanhoHtmlKb: Math.round(bytes / 10.24) / 100,
        cabecalhos: Object.fromEntries(resposta.headers),
        analisadoEm: hoje2
      }),
      html
    };
  } catch (erro) {
    return {
      diagnostico: analisar("", {
        url,
        analisadoEm: hoje2,
        erro: erro instanceof Error ? erro.message : String(erro)
      }),
      html: ""
    };
  }
}

// scripts/radar/diagnostico-site.ts
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
function decodificar(texto) {
  const entidades = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", copy: "\xA9" };
  return texto.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp|copy);/gi, (original, entidade) => {
    if (!entidade.startsWith("#")) return entidades[entidade.toLowerCase()] ?? original;
    const codigo = entidade[1].toLowerCase() === "x" ? parseInt(entidade.slice(2), 16) : parseInt(entidade.slice(1), 10);
    return codigo > 0 && codigo <= 1114111 ? String.fromCodePoint(codigo) : original;
  }).replace(/\s+/g, " ").trim();
}
function metas(html) {
  const resultado = /* @__PURE__ */ new Map();
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const atributos = {};
    for (const atributo of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g)) {
      atributos[atributo[1].toLowerCase()] = decodificar(atributo[2] ?? atributo[3] ?? atributo[4]);
    }
    const nome = atributos.name ?? atributos.property;
    if (nome) resultado.set(nome.toLowerCase(), atributos.content ?? "");
  }
  return resultado;
}
function detectarPlataforma(html, generator, cabecalhos) {
  const sinais = `generator: ${generator}
${html}
${Object.entries(cabecalhos).map(([chave, valor]) => `${chave}: ${valor}`).join("\n")}`;
  const regras = [
    ["Wix", /wixstatic\.com|wixsite\.com|x-wix-|_wixCssImports|generator: wix/i],
    ["WordPress", /wp-content|wp-includes|wp-json|generator: wordpress/i],
    ["Squarespace", /static1\.squarespace\.com|squarespace-cdn|generator: squarespace/i],
    ["Shopify", /cdn\.shopify\.com|myshopify\.com|shopify\.theme/i],
    ["Nuvemshop", /nuvemshop|tiendanube|nuvemcdn|d26lpennugtm8s\.cloudfront/i],
    ["Loja Integrada", /lojaintegrada/i],
    ["Webflow", /data-wf-page|data-wf-site|website-files\.com|generator: webflow/i],
    ["Framer", /framerusercontent\.com|data-framer-|generator: framer/i],
    ["Webnode", /webnode\./i],
    ["Site123", /site123\.(?:me|com)|cdn-cms\.f-static/i],
    ["Weebly", /weebly\.com|editmysite\.com/i],
    ["GoDaddy", /img1\.wsimg\.com|generator: (?:starfield|godaddy)/i],
    ["Google Sites", /sites\.google\.com|gstatic\.com\/atari/i],
    ["Blogger", /blogger\.com\/static|\.blogspot\.com|generator: blogger/i],
    ["Hotmart", /hotmart\.host|generator: hotmart/i]
  ];
  const encontrada = regras.find(([, expressao]) => expressao.test(sinais))?.[0];
  return encontrada === "WordPress" && /elementor/i.test(sinais) ? "WordPress (Elementor)" : encontrada;
}
function analisarHtml(html, contexto) {
  const urlFinal = contexto.urlFinal ?? contexto.url;
  const meta = metas(html);
  const tituloBruto = html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1];
  const titulo = tituloBruto ? decodificar(tituloBruto.replace(/<[^>]*>/g, "")) : void 0;
  const descricao = meta.get("description") || void 0;
  const anoAtual = Number(contexto.analisadoEm.slice(0, 4));
  const anos = [];
  const texto = decodificar(html.replace(/<[^>]*>/g, " "));
  for (const ocorrencia of texto.matchAll(/(?:©|copyright)[^\d©]{0,80}((?:19|20)\d{2}(?:\s*[-\u2013\u2014]\s*(?:19|20)\d{2})?)/gi)) {
    for (const ano of ocorrencia[1].match(/\d{4}/g) ?? []) {
      const numero = Number(ano);
      if (numero >= 1995 && numero <= anoAtual) anos.push(numero);
    }
  }
  const jquery = html.match(/jquery(?:[-./]|\s+v?)(\d+\.\d+(?:\.\d+)?)/i)?.[1] ?? html.match(/jquery(?:\.min)?\.js\?[^"'\s>]*\b(?:ver|version|v)=(\d+\.\d+(?:\.\d+)?)/i)?.[1];
  const linkBio = plataformaDeLinkBio(urlFinal) ?? plataformaDeLinkBio(contexto.url);
  const diagnostico = {
    url: contexto.url,
    urlFinal: contexto.urlFinal,
    status: contexto.status,
    https: /^https:\/\//i.test(urlFinal),
    tempoRespostaMs: contexto.tempoRespostaMs,
    tamanhoHtmlKb: contexto.tamanhoHtmlKb ?? Math.round(new TextEncoder().encode(html).length / 1024 * 100) / 100,
    viewport: Boolean(meta.get("viewport")),
    titulo: titulo || void 0,
    descricao,
    plataforma: linkBio ?? detectarPlataforma(html, meta.get("generator") ?? "", contexto.cabecalhos ?? {}),
    anoCopyright: anos.length ? Math.max(...anos) : void 0,
    jquery,
    temWhatsapp: /(?:wa\.me\/|api\.whatsapp\.com(?:\/|\b)|whatsapp:\/\/)/i.test(html),
    temFormulario: /<form\b/i.test(html),
    rastreamento: [],
    pagespeedMobile: contexto.pagespeedMobile,
    problemas: [],
    situacaoSugerida: "bom",
    analisadoEm: contexto.analisadoEm
  };
  if (/fbq\s*\(|connect\.facebook\.net/i.test(html)) diagnostico.rastreamento.push("Meta Pixel");
  if (/gtag\s*\(|googletagmanager\.com\/gtag/i.test(html)) diagnostico.rastreamento.push("Google Analytics");
  if (/GTM-/i.test(html)) diagnostico.rastreamento.push("Google Tag Manager");
  if (linkBio) {
    diagnostico.problemas.push(`Link da bio \xE9 ${linkBio}, n\xE3o um site pr\xF3prio`);
    diagnostico.situacaoSugerida = "sem-site";
    return diagnostico;
  }
  if (contexto.erro) {
    diagnostico.problemas.push(`Site n\xE3o respondeu: ${contexto.erro}`);
    diagnostico.situacaoSugerida = "ruim";
    return diagnostico;
  }
  let graves = 0;
  let leves = 0;
  const grave = (condicao, mensagem) => {
    if (condicao) {
      graves++;
      diagnostico.problemas.push(mensagem);
    }
  };
  const leve = (condicao, mensagem) => {
    if (condicao) {
      leves++;
      diagnostico.problemas.push(mensagem);
    }
  };
  if (contexto.status !== void 0 && contexto.status >= 400) diagnostico.problemas.push(`Site retornou HTTP ${contexto.status}`);
  grave(!diagnostico.https, "Site sem HTTPS: navegador mostra N\xE3o seguro");
  grave(!diagnostico.viewport, "Sem meta viewport: n\xE3o se adapta ao celular");
  grave((contexto.tempoRespostaMs ?? 0) > 2500, `Resposta lenta: ${((contexto.tempoRespostaMs ?? 0) / 1e3).toFixed(1).replace(".", ",")} s`);
  grave(diagnostico.anoCopyright !== void 0 && anoAtual - diagnostico.anoCopyright >= 3, `Rodap\xE9 com \xA9 ${diagnostico.anoCopyright}: parece abandonado`);
  grave(Boolean(jquery && /^[12]\./.test(jquery)), `jQuery ${jquery}: vers\xE3o antiga`);
  grave(contexto.pagespeedMobile !== void 0 && contexto.pagespeedMobile < 50, `PageSpeed mobile baixo: ${contexto.pagespeedMobile}/100`);
  leve(!diagnostico.titulo, "Sem t\xEDtulo na p\xE1gina");
  leve(!diagnostico.descricao, "Sem meta description");
  leve(!diagnostico.temWhatsapp, "Sem bot\xE3o de WhatsApp");
  diagnostico.situacaoSugerida = (contexto.status ?? 0) >= 400 || graves >= 2 ? "ruim" : graves === 1 || leves >= 2 ? "mediano" : "bom";
  return diagnostico;
}
var LIMITE_CORPO = 3 * 1024 * 1024;
var AGENTE = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
async function buscarPagina(url) {
  const inicio = performance.now();
  const resposta = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15e3), headers: { "User-Agent": AGENTE } });
  return { resposta, tempoRespostaMs: Math.round(performance.now() - inicio) };
}
async function lerCorpo(resposta) {
  const leitor = resposta.body?.getReader();
  if (!leitor) return { html: "", tamanhoHtmlKb: 0 };
  const partes = [];
  let tamanho = 0;
  try {
    while (tamanho < LIMITE_CORPO) {
      const { value, done } = await leitor.read();
      if (done) break;
      const parte = value.subarray(0, LIMITE_CORPO - tamanho);
      partes.push(parte);
      tamanho += parte.length;
    }
  } finally {
    await leitor.cancel();
    leitor.releaseLock();
  }
  return { html: Buffer.concat(partes).toString("utf8"), tamanhoHtmlKb: Math.round(tamanho / 1024 * 100) / 100 };
}
async function pagespeed(url) {
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", "mobile");
  endpoint.searchParams.set("category", "performance");
  if (process.env.PSI_KEY) endpoint.searchParams.set("key", process.env.PSI_KEY);
  try {
    const resposta = await fetch(endpoint, { signal: AbortSignal.timeout(6e4) });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    const resultado = await resposta.json();
    const nota = resultado?.lighthouseResult?.categories?.performance?.score;
    if (typeof nota !== "number" || !Number.isFinite(nota) || nota < 0 || nota > 1) throw new Error("resposta sem nota de desempenho v\xE1lida");
    return Math.round(nota * 100);
  } catch (erro) {
    console.error(`Aviso: PageSpeed indispon\xEDvel (${erro instanceof Error ? erro.message : String(erro)})`);
    return void 0;
  }
}
async function diagnosticar(url, { psi = false } = {}) {
  const entrada = url.trim();
  if (!entrada) throw new Error("url: informe o endere\xE7o do site");
  const temEsquema = /^[a-z][a-z\d+.-]*:/i.test(entrada) && !/^[^/]+:\d+(?:\/|$)/.test(entrada);
  const endereco = temEsquema ? entrada : `https://${entrada}`;
  const contexto = { url: endereco, analisadoEm: new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza" }).format(/* @__PURE__ */ new Date()) };
  if (plataformaDeLinkBio(endereco)) return analisarHtml("", contexto);
  const parsed = new URL(endereco);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("url: use um endere\xE7o http(s)");
  let html = "";
  try {
    let pagina;
    let requisitada = endereco;
    try {
      pagina = await buscarPagina(requisitada);
    } catch (erro) {
      if (temEsquema) throw erro;
      requisitada = endereco.replace(/^https:/, "http:");
      pagina = await buscarPagina(requisitada);
    }
    contexto.urlFinal = pagina.resposta.url || requisitada;
    contexto.status = pagina.resposta.status;
    contexto.tempoRespostaMs = pagina.tempoRespostaMs;
    contexto.cabecalhos = Object.fromEntries(pagina.resposta.headers.entries());
    const corpo = await lerCorpo(pagina.resposta);
    html = corpo.html;
    contexto.tamanhoHtmlKb = corpo.tamanhoHtmlKb;
  } catch (erro) {
    const causa = erro instanceof Error && erro.cause && typeof erro.cause === "object" && "code" in erro.cause ? ` (${String(erro.cause.code)})` : "";
    contexto.erro = `${erro instanceof Error ? erro.message : String(erro)}${causa}`;
  }
  if (psi && !contexto.erro && (contexto.status ?? 0) < 400) contexto.pagespeedMobile = await pagespeed(contexto.urlFinal ?? endereco);
  return analisarHtml(html, contexto);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === "--") process.argv.splice(2, 1);
  try {
    const { values, positionals } = parseArgs({ allowPositionals: true, options: { psi: { type: "boolean", default: false } } });
    if (positionals.length !== 1) throw new Error("Uso: node scripts/diagnostico-site.ts <url> [--psi]");
    const resultado = await diagnosticar(positionals[0], { psi: values.psi });
    console.log(JSON.stringify(resultado, null, 2));
    console.error(`${resultado.urlFinal ?? resultado.url}: ${resultado.situacaoSugerida}${resultado.plataforma ? ` (${resultado.plataforma})` : ""}`);
    for (const problema of resultado.problemas) console.error(`- ${problema}`);
  } catch (erro) {
    console.error(erro instanceof Error ? erro.message : String(erro));
    process.exitCode = 1;
  }
}

// server/radar/busca.ts
var json = (res, status, body) => {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(body);
};
var hoje = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza" }).format(
  /* @__PURE__ */ new Date()
);
var limitar = async (itens, concorrencia, fn) => {
  const saida = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(concorrencia, itens.length) }, async () => {
      while (i < itens.length) {
        const n = i++;
        saida[n] = await fn(itens[n]);
      }
    })
  );
  return saida;
};
function local(address = "") {
  const trecho = address.split(",").map((x) => x.trim()).reverse().map((x) => x.match(/^(.+?)\s+-\s+([A-Z]{2})$/)).find(Boolean);
  return trecho ? { cidade: trecho[1], uf: trecho[2] } : { cidade: "N\xE3o informada", uf: "BR" };
}
function criterio(ok, evidencia, fonte, nivel) {
  return {
    ok,
    evidencia,
    ...fonte ? { fonte } : {},
    ...nivel ? { nivel } : {}
  };
}
async function mensagemClaude(nome, evidencia, config) {
  const resposta = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: AbortSignal.timeout(8e3),
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-haiku-5-5",
      max_tokens: 220,
      temperature: 0.3,
      system: "Escreva em PT-BR. Exatamente 3 frases, at\xE9 280 caracteres, sem travess\xE3o, pre\xE7o, reuni\xE3o ou link. Cite s\xF3 o fato fornecido. Ofere\xE7a a pr\xE9via descrita e pe\xE7a permiss\xE3o. N\xE3o invente.",
      messages: [
        {
          role: "user",
          content: `Neg\xF3cio: ${nome}. Evid\xEAncia: ${evidencia}. Oferta: ${config.oferta.primeira}. Assinatura/conta: ${config.envio.conta || "nossa equipe"}.`
        }
      ]
    })
  });
  if (!resposta.ok) throw new Error(`Claude HTTP ${resposta.status}`);
  const data = await resposta.json();
  const texto = data.content?.find((x) => x.type === "text")?.text?.replace(/\u2014/g, ",").trim();
  if (!texto || texto.length > 280 || (texto.match(/[.!?](?:\s|$)/g)?.length ?? 0) !== 3)
    throw new Error("Mensagem do Claude fora do contrato");
  return texto;
}
async function places(nicho, regiao, quantidade) {
  const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    signal: AbortSignal.timeout(1e4),
    headers: {
      "content-type": "application/json",
      "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.internationalPhoneNumber,places.rating,places.userRatingCount,places.googleMapsUri,places.businessStatus,places.types"
    },
    body: JSON.stringify({
      textQuery: `${nicho} em ${regiao}`,
      languageCode: "pt-BR",
      regionCode: "BR",
      maxResultCount: quantidade
    })
  });
  if (!r.ok) throw new Error(`Google Places HTTP ${r.status}`);
  return (await r.json()).places ?? [];
}
async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { erro: "Use POST." });
  const url = process.env.VITE_SUPABASE_URL, anon = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY, token = String(req.headers.authorization ?? "").match(
    /^Bearer\s+(.+)$/i
  )?.[1];
  if (!url || !anon)
    return json(res, 503, { erro: "Supabase n\xE3o configurado." });
  if (!process.env.GOOGLE_PLACES_API_KEY || !process.env.ANTHROPIC_API_KEY)
    return json(res, 503, {
      erro: "Busca r\xE1pida indispon\xEDvel: configure Google Places e Anthropic."
    });
  if (!token) return json(res, 401, { erro: "Sess\xE3o ausente." });
  const db = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const {
    data: { user },
    error: authErro
  } = await db.auth.getUser(token);
  if (authErro || !user)
    return json(res, 401, { erro: "Sess\xE3o inv\xE1lida ou expirada." });
  const { data: ownerRadar, error: ownerErro } = await db.rpc("radar_owner_atual");
  if (ownerErro || typeof ownerRadar !== "string")
    return json(res, 403, { erro: "Seu usu\xE1rio n\xE3o tem acesso ao Radar." });
  let pedido;
  try {
    pedido = validarPedidoBusca("rapida", req.body);
  } catch (e) {
    return json(res, 400, { erro: e instanceof Error ? e.message : String(e) });
  }
  const inserida = await db.from("radar_buscas").insert(pedido).select("id").single();
  if (inserida.error)
    return inserida.error.code === "42501" ? json(res, 403, { erro: "Seu usu\xE1rio n\xE3o tem acesso ao Radar." }) : json(res, inserida.error.code === "P0001" ? 429 : 400, {
      erro: inserida.error.message
    });
  const id = inserida.data.id;
  const atualizar = (status, resultado, erro) => db.rpc("radar_atualizar_busca", {
    p_id: id,
    p_status: status,
    p_resultado: resultado ?? null,
    p_erro: erro ?? null
  });
  await atualizar("rodando");
  try {
    const [
      { data: leadRows },
      { data: descRows },
      { data: cfgRow },
      candidatos
    ] = await Promise.all([
      db.from("radar_leads").select("dados").eq("owner", ownerRadar),
      db.from("radar_descartados").select("dados").eq("owner", ownerRadar),
      db.from("radar_config").select("dados").eq("owner", ownerRadar).maybeSingle(),
      places(pedido.nicho, pedido.regiao, pedido.quantidade)
    ]);
    const existentes = (leadRows ?? []).map((x) => x.dados), descartados = (descRows ?? []).map((x) => x.dados), config = cfgRow?.dados;
    if (!config) throw new Error("Configure a oferta do Radar antes da busca.");
    let duplicados = 0, descartadosN = 0;
    const ids = [];
    await limitar(
      candidatos.filter((p) => p.businessStatus === "OPERATIONAL"),
      5,
      async (p) => {
        const telefone = telefoneDe(
          p.internationalPhoneNumber ?? p.nationalPhoneNumber ?? ""
        );
        let diagnostico, html = "";
        if (p.websiteUri)
          ({ diagnostico, html } = await diagnosticarSiteSeguro(
            p.websiteUri,
            analisarHtml
          ));
        const contatos = extrairContatosHtml(html);
        const instagram = contatos.instagram;
        const whats = telefoneDe(contatos.whatsapp ?? telefone ?? "");
        const loc = local(p.formattedAddress);
        const candidato = {
          nome: p.displayName?.text ?? "Neg\xF3cio",
          cidade: loc.cidade,
          instagram: instagram ? { usuario: instagram, ultimoPost: "" } : void 0,
          site: { url: p.websiteUri },
          contato: { whatsapp: whats, telefone }
        };
        if (acharDuplicado(candidato, existentes, descartados)) {
          duplicados++;
          return;
        }
        const fonte = p.googleMapsUri ?? p.websiteUri ?? "https://www.google.com/maps";
        const nivel = diagnostico?.situacaoSugerida ?? "sem-site";
        const nao = "N\xE3o verificado na busca r\xE1pida";
        const evid = diagnostico?.problemas[0] ?? (p.websiteUri ? "Site analisado sem problema t\xE9cnico evidente" : "Ficha do Google sem site pr\xF3prio");
        const criterios = {
          presenca_web: criterio(
            nivel !== "bom",
            evid,
            p.websiteUri ?? fonte,
            nivel
          ),
          so_insta_whats: criterio(
            !p.websiteUri,
            !p.websiteUri ? "Ficha do Google sem site pr\xF3prio" : nao,
            !p.websiteUri ? fonte : void 0
          ),
          concorrente_melhor: criterio(false, nao),
          investe_divulgacao: criterio(false, nao),
          frequencia_posts: criterio(false, nao),
          boas_avaliacoes: criterio(
            Boolean(
              p.rating && p.rating >= 4.5 && (p.userRatingCount ?? 0) >= 20
            ),
            p.rating ? `Nota ${p.rating} com ${p.userRatingCount ?? 0} avalia\xE7\xF5es no Google` : "Sem avalia\xE7\xF5es verific\xE1veis",
            fonte
          ),
          valor_agregado: criterio(false, nao),
          crescimento: criterio(false, nao),
          porte_ideal: criterio(
            Boolean((p.userRatingCount ?? 0) >= 20),
            `${p.userRatingCount ?? 0} avalia\xE7\xF5es p\xFAblicas no Google`,
            fonte
          ),
          decisor_identificado: criterio(false, nao)
        };
        let mensagem = "";
        try {
          mensagem = await mensagemClaude(candidato.nome, evid, config);
        } catch {
        }
        const canal = instagram ? "instagram" : whats ? "whatsapp" : void 0;
        const lead = {
          origem: "rapida",
          id: instagram ? instagram : `g-${createHash("sha256").update(p.id).digest("hex").slice(0, 16)}`,
          nome: candidato.nome,
          segmento: pedido.nicho,
          cidade: loc.cidade,
          uf: loc.uf,
          ...instagram ? { instagram: { usuario: instagram } } : {},
          site: p.websiteUri ? { url: p.websiteUri, diagnostico } : {},
          google: {
            nota: p.rating,
            avaliacoes: p.userRatingCount,
            url: p.googleMapsUri
          },
          contato: {
            ...whats ? { whatsapp: whats } : {},
            ...telefone ? { telefone } : {}
          },
          problemas: [evid],
          oportunidade: config.oferta.primeira,
          servicos: ["site"],
          criterios,
          abordagem: { canal: canal ?? "whatsapp", mensagem },
          pontuacao: calcularPontuacao(criterios),
          analisadoEm: hoje(),
          fontes: [fonte, ...p.websiteUri ? [p.websiteUri] : []]
        };
        const valid = validarLead(lead, hoje());
        if (!valid.ok) {
          descartadosN++;
          return;
        }
        const l = valid.lead;
        const gravada = await db.from("radar_leads").insert({
          owner: ownerRadar,
          id: l.id,
          dados: l,
          pontuacao: l.pontuacao,
          faixa: faixaDa(l.pontuacao),
          analisado_em: l.analisadoEm
        });
        if (gravada.error) {
          if (gravada.error.code === "23505") duplicados++;
          else throw gravada.error;
        } else {
          existentes.push(l);
          ids.push(l.id);
          if (canal && mensagem) {
            const envio = {
              id: `${l.id}:primeira`,
              leadId: l.id,
              canal,
              destino: canal === "instagram" ? instagram : whats,
              tipo: "primeira",
              mensagem,
              status: "rascunho",
              criadoEm: (/* @__PURE__ */ new Date()).toISOString()
            };
            await db.from("radar_envios").insert({
              owner: ownerRadar,
              id: envio.id,
              lead_id: l.id,
              status: "rascunho",
              dados: envio
            });
          }
        }
      }
    );
    const resultado = {
      achados: candidatos.length,
      gravados: ids.length,
      duplicados,
      descartados: descartadosN,
      ids
    };
    await atualizar("concluida", resultado);
    return json(res, 200, { buscaId: id, ...resultado });
  } catch (e) {
    const erro = e instanceof Error ? e.message : String(e);
    await atualizar("falhou", void 0, erro);
    return json(res, 502, { erro, buscaId: id });
  }
}
export {
  handler as default,
  local,
  mensagemClaude,
  places
};
