import { test, vi } from "vitest";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  dentroDoLimiteDiario,
  LIMITES_BUSCA,
  validarPedidoBusca,
} from "../../shared/radar/buscas.ts";
import { extrairContatosHtml, fetchSeguro, ipPublico } from "../../shared/radar/site.ts";
import { aplicarAcao, linkDeEnvio } from "../../shared/radar/envio.ts";
import { validarLead } from "../../shared/radar/validar.ts";
import { AGORA, envioTeste, estadoTeste } from "./apoio-envio.ts";
import { local, mensagemClaude, places } from "../../server/radar/busca.ts";
import { buildSync } from "esbuild";

test("buscas: contrato espelha quantidades e limites diários do trigger", () => {
  assert.deepEqual(LIMITES_BUSCA, {
    rapida: { quantidade: 10, porDia: 5 },
    completa: { quantidade: 15, porDia: 2 },
  });
  assert.equal(
    validarPedidoBusca("rapida", {
      nicho: "Clínicas",
      regiao: "Fortaleza",
      quantidade: 10,
    }).quantidade,
    10
  );
  assert.throws(
    () =>
      validarPedidoBusca("rapida", {
        nicho: "x",
        regiao: "Fortaleza",
        quantidade: 11,
      }),
    /Nicho|Quantidade/
  );
  assert.equal(dentroDoLimiteDiario("rapida", 4), true);
  assert.equal(dentroDoLimiteDiario("rapida", 5), false);
  const sql = readFileSync(
    new URL(
      "../../supabase/migrations/0006_radar_parceiro.sql",
      import.meta.url
    ),
    "utf8"
  );
  assert.match(sql, /America\/Fortaleza/);
  assert.match(sql, /then 5 else 2/);
  const compartilhado = readFileSync(new URL("../../supabase/migrations/0007_radar_compartilhado.sql", import.meta.url), "utf8");
  assert.match(compartilhado, /radar_owner_atual/);
  assert.match(compartilhado, /owner = \(select public\.radar_owner_atual\(\)\)/);
  assert.match(compartilhado, /new\.owner := public\.radar_owner_atual\(\)/);
  assert.match(compartilhado, /public\.radar_tem_acesso\(\)/);
});

test("convite compartilha Radar do dono e não cria configuração própria", async () => {
  const src = readFileSync(new URL("./parceiro.ts", import.meta.url), "utf8");
  assert.match(src, /radar_owner: dono\.id/);
  assert.match(src, /values\.radar \?\? process\.env\.NOITE_OWNER_EMAIL/);
  assert.doesNotMatch(src, /CONFIG_PARCEIRO|from\("radar_config"\)/);
});

test("SSRF: recusa IP privado direto e redirecionamento para rede privada", async () => {
  for (const ip of [
    "127.0.0.1",
    "10.0.0.1",
    "169.254.169.254",
    "192.168.1.2",
    "::1",
    "fc00::1",
  ])
    assert.equal(ipPublico(ip), false, ip);
  await assert.rejects(() => fetchSeguro("http://127.0.0.1"), /privado|local/);
  const falsoFetch = vi.fn(
    async () =>
      new Response(null, {
        status: 302,
        headers: { location: "http://10.0.0.5/segredo" },
      })
  );
  const resolver = vi.fn(async () => [
    { address: "142.250.79.14", family: 4 },
  ]) as any;
  await assert.rejects(
    () =>
      fetchSeguro("https://public.example", {
        fetch: falsoFetch as any,
        resolver,
      }),
    /privado|local/
  );
  assert.equal(falsoFetch.mock.calls.length, 1);
});

test("lead rápido sem Instagram é válido e mantém id estável", () => {
  const lead: any = JSON.parse(
    readFileSync(
      new URL("./fixtures/lead-exemplo.json", import.meta.url),
      "utf8"
    )
  );
  lead.origem = "rapida";
  lead.id = "g-0123456789abcdef";
  delete lead.instagram;
  lead.abordagem = { canal: "whatsapp", mensagem: "" };
  const resultado = validarLead(lead, "2026-10-23");
  assert.equal(
    resultado.ok,
    true,
    !resultado.ok ? resultado.erros.join("\n") : ""
  );
  if (resultado.ok) assert.equal(resultado.lead.id, "g-0123456789abcdef");
});

test("envio manual ignora janela, marca enviado e move o funil", () => {
  const estado = estadoTeste();
  estado.envios = [envioTeste()];
  estado.config.envio.soDiasUteis = true;
  const sabado = new Date("2026-10-24T03:00:00Z");
  const resultado = aplicarAcao(
    estado,
    {
      acao: "enviado-manual",
      id: estado.envios[0].id,
      base: "Mensagem fictícia",
      mensagem: "Mensagem revisada",
    },
    sabado
  ).estado;
  assert.equal(resultado.envios[0].status, "enviado");
  assert.equal(resultado.envios[0].mensagem, "Mensagem revisada");
  assert.equal(resultado.registros.lead_ficticio_001.etapa, "abordado");
  assert.throws(
    () =>
      aplicarAcao(
        { ...resultado, envios: [envioTeste()] },
        { acao: "enviado-manual", id: estado.envios[0].id, base: "Outra" },
        AGORA
      ),
    /mudou/
  );
});

test("links de envio codificam Instagram e WhatsApp", () => {
  assert.equal(
    linkDeEnvio(envioTeste({ destino: "@Perfil.Teste" })),
    "https://ig.me/m/perfil.teste"
  );
  assert.equal(
    linkDeEnvio(
      envioTeste({
        canal: "whatsapp",
        destino: "+55 (85) 99999-0000",
        mensagem: "Oi, tudo bem?",
      })
    ),
    "https://wa.me/5585999990000?text=Oi%2C%20tudo%20bem%3F"
  );
});

test("Claude rápido: mock valida a mensagem curta sem chave real", async () => {
  process.env.ANTHROPIC_API_KEY = "mock";
  const original = globalThis.fetch;
  globalThis.fetch = vi.fn(
    async () =>
      new Response(
        JSON.stringify({
          content: [
            {
              type: "text",
              text: "Oi, Clínica Exemplo! Vi que o site não abre no celular. Posso mandar uma prévia da página?",
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
  ) as any;
  try {
    const texto = await mensagemClaude(
      "Clínica Exemplo",
      "site sem viewport",
      estadoTeste().config
    );
    assert.ok(texto.length <= 280);
    assert.equal(texto.includes("\u2014"), false);
  } finally {
    globalThis.fetch = original;
  }
});

test("Places rápido: mock usa Text Search New e field mask mínimo", async () => {
  process.env.GOOGLE_PLACES_API_KEY = "mock";
  const original = globalThis.fetch;
  const falso = vi.fn(
    async () =>
      new Response(
        JSON.stringify({
          places: [
            {
              id: "place-mock",
              displayName: { text: "Negócio Mock" },
              businessStatus: "OPERATIONAL",
            },
          ],
        }),
        { status: 200 }
      )
  );
  globalThis.fetch = falso as any;
  try {
    const resultado = await places("clínicas", "Fortaleza", 3);
    assert.equal(resultado[0].id, "place-mock");
    const opcoes = falso.mock.calls[0][1] as RequestInit;
    assert.match(
      String((opcoes.headers as Record<string, string>)["X-Goog-FieldMask"]),
      /places\.websiteUri/
    );
    assert.equal(JSON.parse(String(opcoes.body)).maxResultCount, 3);
  } finally {
    globalThis.fetch = original;
  }
});

test("site: Instagram só sai de link do instagram.com, nunca de e-mail ou CSS", () => {
  const html = `<style>@media (max-width:600px){}</style><a href="mailto:contato@gmail.com">contato@gmail.com</a>
    <a href="https://www.instagram.com/p/ABC123/">post</a><a href="https://instagram.com/perfil.teste?igsh=x">Instagram</a>`;
  assert.equal(extrairContatosHtml(html).instagram, "perfil.teste");
  assert.equal(extrairContatosHtml("<p>@media @import contato@empresa.com.br</p>").instagram, undefined);
});

test("busca: cidade e UF saem do trecho Cidade - UF do endereço do Google", () => {
  assert.deepEqual(local("R. Teste, 10 - Centro, Recife - PE, 50000-000, Brasil"), { cidade: "Recife", uf: "PE" });
  assert.deepEqual(local("Av. Teste, 99 - Aldeota, Fortaleza - CE, Brasil"), { cidade: "Fortaleza", uf: "CE" });
  assert.deepEqual(local("Endereço sem padrão"), { cidade: "Não informada", uf: "BR" });
});

test("busca: api/radar/busca.js está em dia com server/radar/busca.ts (rode pnpm build:api)", () => {
  const gerado = buildSync({
    entryPoints: ["server/radar/busca.ts"], platform: "node", packages: "external", bundle: true, format: "esm", write: false,
    banner: { js: "// Gerado por pnpm build:api a partir de server/radar/busca.ts. Não edite." },
  }).outputFiles[0].text;
  assert.equal(readFileSync("api/radar/busca.js", "utf8"), gerado);
});
