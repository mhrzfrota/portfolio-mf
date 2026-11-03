import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { validarPedidoBusca } from "../../shared/radar/buscas.ts";
import { acharDuplicado } from "../../shared/radar/dedup.ts";
import { calcularPontuacao } from "../../shared/radar/pontuacao.ts";
import { faixaDa } from "../../shared/radar/criterios.ts";
import { telefoneDe } from "../../shared/radar/normalizar.ts";
import { validarLead } from "../../shared/radar/validar.ts";
import type {
  Avaliacao,
  ConfigRadar,
  Descartado,
  Lead,
} from "../../shared/radar/tipos.ts";
import {
  diagnosticarSiteSeguro,
  extrairContatosHtml,
} from "../../shared/radar/site.ts";
import { analisarHtml } from "../../scripts/radar/diagnostico-site.ts";

type Req = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};
type Res = {
  status(n: number): Res;
  json(x: unknown): void;
  setHeader(k: string, v: string): void;
};
type Place = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  businessStatus?: string;
  types?: string[];
};
const json = (res: Res, status: number, body: unknown) => {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(body);
};
const hoje = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza" }).format(
    new Date()
  );
const limitar = async <T, R>(
  itens: T[],
  concorrencia: number,
  fn: (x: T) => Promise<R>
) => {
  const saida: R[] = [];
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
/** "R. X, 10 - Bairro, Fortaleza - CE, 60000-000, Brasil": cidade e UF vêm do trecho "Cidade - UF". */
export function local(address = "") {
  const trecho = address
    .split(",")
    .map(x => x.trim())
    .reverse()
    .map(x => x.match(/^(.+?)\s+-\s+([A-Z]{2})$/))
    .find(Boolean);
  return trecho
    ? { cidade: trecho[1], uf: trecho[2] }
    : { cidade: "Não informada", uf: "BR" };
}
function criterio(
  ok: boolean,
  evidencia: string,
  fonte?: string,
  nivel?: Avaliacao["nivel"]
): Avaliacao {
  return {
    ok,
    evidencia,
    ...(fonte ? { fonte } : {}),
    ...(nivel ? { nivel } : {}),
  };
}
export async function mensagemClaude(
  nome: string,
  evidencia: string,
  config: ConfigRadar
) {
  const resposta = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: AbortSignal.timeout(8_000),
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-5-5",
      max_tokens: 220,
      temperature: 0.3,
      system:
        "Escreva em PT-BR. Exatamente 3 frases, até 280 caracteres, sem travessão, preço, reunião ou link. Cite só o fato fornecido. Ofereça a prévia descrita e peça permissão. Não invente.",
      messages: [
        {
          role: "user",
          content: `Negócio: ${nome}. Evidência: ${evidencia}. Oferta: ${config.oferta.primeira}. Assinatura/conta: ${config.envio.conta || "nossa equipe"}.`,
        },
      ],
    }),
  });
  if (!resposta.ok) throw new Error(`Claude HTTP ${resposta.status}`);
  const data = (await resposta.json()) as {
    content?: { type: string; text?: string }[];
  };
  const texto = data.content
    ?.find(x => x.type === "text")
    ?.text?.replace(/\u2014/g, ",")
    .trim();
  if (
    !texto ||
    texto.length > 280 ||
    (texto.match(/[.!?](?:\s|$)/g)?.length ?? 0) !== 3
  )
    throw new Error("Mensagem do Claude fora do contrato");
  return texto;
}
export async function places(
  nicho: string,
  regiao: string,
  quantidade: number
) {
  const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    signal: AbortSignal.timeout(10_000),
    headers: {
      "content-type": "application/json",
      "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY!,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.internationalPhoneNumber,places.rating,places.userRatingCount,places.googleMapsUri,places.businessStatus,places.types",
    },
    body: JSON.stringify({
      textQuery: `${nicho} em ${regiao}`,
      languageCode: "pt-BR",
      regionCode: "BR",
      maxResultCount: quantidade,
    }),
  });
  if (!r.ok) throw new Error(`Google Places HTTP ${r.status}`);
  return ((await r.json()) as { places?: Place[] }).places ?? [];
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== "POST") return json(res, 405, { erro: "Use POST." });
  const url = process.env.VITE_SUPABASE_URL,
    anon =
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
      process.env.VITE_SUPABASE_ANON_KEY,
    token = String(req.headers.authorization ?? "").match(
      /^Bearer\s+(.+)$/i
    )?.[1];
  if (!url || !anon)
    return json(res, 503, { erro: "Supabase não configurado." });
  if (!process.env.GOOGLE_PLACES_API_KEY || !process.env.ANTHROPIC_API_KEY)
    return json(res, 503, {
      erro: "Busca rápida indisponível: configure Google Places e Anthropic.",
    });
  if (!token) return json(res, 401, { erro: "Sessão ausente." });
  const db = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error: authErro,
  } = await db.auth.getUser(token);
  if (authErro || !user)
    return json(res, 401, { erro: "Sessão inválida ou expirada." });
  const { data: ownerRadar, error: ownerErro } = await db.rpc("radar_owner_atual");
  if (ownerErro || typeof ownerRadar !== "string")
    return json(res, 403, { erro: "Seu usuário não tem acesso ao Radar." });
  let pedido;
  try {
    pedido = validarPedidoBusca("rapida", req.body);
  } catch (e) {
    return json(res, 400, { erro: e instanceof Error ? e.message : String(e) });
  }
  const inserida = await db
    .from("radar_buscas")
    .insert(pedido)
    .select("id")
    .single();
  if (inserida.error)
    return inserida.error.code === "42501"
      ? json(res, 403, { erro: "Seu usuário não tem acesso ao Radar." })
      : json(res, inserida.error.code === "P0001" ? 429 : 400, {
          erro: inserida.error.message,
        });
  const id = inserida.data.id;
  const atualizar = (status: string, resultado?: unknown, erro?: string) =>
    db.rpc("radar_atualizar_busca", {
      p_id: id,
      p_status: status,
      p_resultado: resultado ?? null,
      p_erro: erro ?? null,
    });
  await atualizar("rodando");
  try {
    const [
      { data: leadRows },
      { data: descRows },
      { data: cfgRow },
      candidatos,
    ] = await Promise.all([
      db.from("radar_leads").select("dados").eq("owner", ownerRadar),
      db.from("radar_descartados").select("dados").eq("owner", ownerRadar),
      db.from("radar_config").select("dados").eq("owner", ownerRadar).maybeSingle(),
      places(pedido.nicho, pedido.regiao, pedido.quantidade),
    ]);
    const existentes = (leadRows ?? []).map(x => x.dados as Lead),
      descartados = (descRows ?? []).map(x => x.dados as Descartado),
      config = cfgRow?.dados as ConfigRadar | undefined;
    if (!config) throw new Error("Configure a oferta do Radar antes da busca.");
    let duplicados = 0,
      descartadosN = 0;
    const ids: string[] = [];
    await limitar(
      candidatos.filter(p => p.businessStatus === "OPERATIONAL"),
      5,
      async p => {
        const telefone = telefoneDe(
          p.internationalPhoneNumber ?? p.nationalPhoneNumber ?? ""
        );
        let diagnostico,
          html = "";
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
          nome: p.displayName?.text ?? "Negócio",
          cidade: loc.cidade,
          instagram: instagram
            ? { usuario: instagram, ultimoPost: "" }
            : undefined,
          site: { url: p.websiteUri },
          contato: { whatsapp: whats, telefone },
        };
        if (acharDuplicado(candidato, existentes, descartados)) {
          duplicados++;
          return;
        }
        const fonte =
          p.googleMapsUri ?? p.websiteUri ?? "https://www.google.com/maps";
        const nivel = diagnostico?.situacaoSugerida ?? "sem-site";
        const nao = "Não verificado na busca rápida";
        const evid =
          diagnostico?.problemas[0] ??
          (p.websiteUri
            ? "Site analisado sem problema técnico evidente"
            : "Ficha do Google sem site próprio");
        const criterios: any = {
          presenca_web: criterio(
            nivel !== "bom",
            evid,
            p.websiteUri ?? fonte,
            nivel
          ),
          so_insta_whats: criterio(
            !p.websiteUri,
            !p.websiteUri ? "Ficha do Google sem site próprio" : nao,
            !p.websiteUri ? fonte : undefined
          ),
          concorrente_melhor: criterio(false, nao),
          investe_divulgacao: criterio(false, nao),
          frequencia_posts: criterio(false, nao),
          boas_avaliacoes: criterio(
            Boolean(
              p.rating && p.rating >= 4.5 && (p.userRatingCount ?? 0) >= 20
            ),
            p.rating
              ? `Nota ${p.rating} com ${p.userRatingCount ?? 0} avaliações no Google`
              : "Sem avaliações verificáveis",
            fonte
          ),
          valor_agregado: criterio(false, nao),
          crescimento: criterio(false, nao),
          porte_ideal: criterio(
            Boolean((p.userRatingCount ?? 0) >= 20),
            `${p.userRatingCount ?? 0} avaliações públicas no Google`,
            fonte
          ),
          decisor_identificado: criterio(false, nao),
        };
        let mensagem = "";
        try {
          mensagem = await mensagemClaude(candidato.nome, evid, config);
        } catch {}
        const canal = instagram ? "instagram" : whats ? "whatsapp" : undefined;
        const lead: any = {
          origem: "rapida",
          id: instagram
            ? instagram
            : `g-${createHash("sha256").update(p.id).digest("hex").slice(0, 16)}`,
          nome: candidato.nome,
          segmento: pedido.nicho,
          cidade: loc.cidade,
          uf: loc.uf,
          ...(instagram ? { instagram: { usuario: instagram } } : {}),
          site: p.websiteUri ? { url: p.websiteUri, diagnostico } : {},
          google: {
            nota: p.rating,
            avaliacoes: p.userRatingCount,
            url: p.googleMapsUri,
          },
          contato: {
            ...(whats ? { whatsapp: whats } : {}),
            ...(telefone ? { telefone } : {}),
          },
          problemas: [evid],
          oportunidade: config.oferta.primeira,
          servicos: ["site"],
          criterios,
          abordagem: { canal: canal ?? "whatsapp", mensagem },
          pontuacao: calcularPontuacao(criterios),
          analisadoEm: hoje(),
          fontes: [fonte, ...(p.websiteUri ? [p.websiteUri] : [])],
        };
        const valid = validarLead(lead, hoje());
        if (!valid.ok) {
          descartadosN++;
          return;
        }
        const l = valid.lead;
        const gravada = await db
          .from("radar_leads")
          .insert({
          owner: ownerRadar,
            id: l.id,
            dados: l,
            pontuacao: l.pontuacao,
            faixa: faixaDa(l.pontuacao),
            analisado_em: l.analisadoEm,
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
              destino: canal === "instagram" ? instagram! : whats!,
              tipo: "primeira",
              mensagem,
              status: "rascunho",
              criadoEm: new Date().toISOString(),
            };
            await db
              .from("radar_envios")
              .insert({
            owner: ownerRadar,
                id: envio.id,
                lead_id: l.id,
                status: "rascunho",
                dados: envio,
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
      ids,
    };
    await atualizar("concluida", resultado);
    return json(res, 200, { buscaId: id, ...resultado });
  } catch (e) {
    const erro = e instanceof Error ? e.message : String(e);
    await atualizar("falhou", undefined, erro);
    return json(res, 502, { erro, buscaId: id });
  }
}
