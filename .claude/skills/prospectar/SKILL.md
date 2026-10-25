---
name: prospectar
description: Rodada de prospecção do Radar da MF Services. Acha negócios no Brasil que precisam de site, landing page, página de vendas ou VSL; analisa o Instagram (só entra quem postou nos últimos 30 dias), o site, o Google e os concorrentes; pontua de 0 a 100 com evidência verificável; e grava cada lead com uma abordagem personalizada. Use quando o Matheus disser "/prospectar", "acha leads de X em Y", "rodada de prospecção", "procura clientes" ou "radar".
argument-hint: "<nicho> em <cidade, UF ou Brasil>, <quantidade> leads"
---

# /prospectar

Objetivo: encontrar clientes qualificados, priorizar as melhores oportunidades e deixar a abordagem pronta. Cada lead entra em tabela `radar_leads` pelo `pnpm radar:lead`, e o painel (`pnpm dev`, https://emefeservices.vercel.app/radar) mostra na hora.

**O agente da rodada nunca envia mensagem, não segue, não curte, não comenta.** Ele só lê e grava. A mensagem de cada lead quente entra na **fila de envio** como rascunho; o Matheus aprova no painel e o envio é outro passo (`/enviar`).

## Entrada

`<nicho> em <região>, <quantidade>`. Ex.: "clínicas de estética em Recife, 5 leads", "advogados em SC, 8", "escolas de idioma no Brasil, 10".

- Quantidade: padrão 5, máximo 15 por rodada (o Instagram trava conta que abre perfil demais).
- Sem nicho: escolha um da lista de alto valor (abaixo) e uma capital ainda pouco presente no `pnpm radar:lead -- listar`. Diga em uma linha qual escolheu e siga.
- "Brasil": espalhe por cidades diferentes, uma ou duas por lead.

## Ferramentas

| Para | Use |
|---|---|
| Achar negócios, Google, notícias | WebSearch (modo standard) e WebFetch |
| Instagram e Biblioteca de Anúncios | Claude in Chrome. O Instagram só abre logado. Carregue as ferramentas do Chrome numa única ToolSearch, abra uma aba nova e trabalhe nela |
| Diagnóstico do site | `pnpm radar:site -- <url>` (JSON no stdout). `--psi` acrescenta o PageSpeed mobile |
| Régua, duplicado, gravar | `pnpm radar:lead -- criterios`, `existe`, `adicionar`, `descartar`, `listar` |

## Passo 1: preparar

1. `pnpm radar:lead -- criterios`: a régua de 0 a 100. **É a única regra de pontuação**; não invente critério.
2. `pnpm radar:lead -- listar`: o que já existe, para não repetir cidade e nicho sem querer.
3. configuração do Radar (Supabase): o **cliente ideal** (nichos, regiões, sinais e quem fica de fora) e a oferta da primeira mensagem. Sem nicho ou região no pedido, escolha dali.

## Passo 2: achar candidatos

Junte de 2 a 3 vezes a quantidade pedida, porque parte cai na análise.

1. **Busca:** "<nicho> <cidade>", "<nicho> <cidade> instagram", "melhores <nicho> em <cidade>", fichas do Google Maps, guias locais, Doctoralia (saúde), listas de associação (OAB, CRO...).
2. **Instagram:** a busca de `https://www.instagram.com/explore/` (campo Pesquisar no topo) com "<nicho> <cidade>" devolve perfis de negócio direto; também hashtags de nicho e cidade e os perfis sugeridos de um bom candidato. Google com "<nicho> <cidade>" traz perfis e sites misturados: bom para achar candidato com site antigo.
3. **Antes de analisar qualquer um:** `pnpm radar:lead -- existe @usuario dominio.com.br <telefone>`. Já existe ou já foi descartado: pule.

**Alvo:** negócio local com dono acessível e ticket médio ou alto. Valor agregado: clínica, estética, odontologia, fisioterapia, nutrição, psicologia, advocacia, contabilidade, arquitetura, design de interiores, imobiliária, construtora, escola, curso, idiomas, academia, studio de pilates, turismo, pousada, eventos, buffet, fotografia, mentoria, infoproduto, loja de veículos, energia solar, móveis planejados.

**Fora do alvo:** franquia nacional (quem decide é a matriz), rede grande, órgão público, perfil pessoal sem negócio, negócio que já tem site bom e campanha profissional, perfil com cara de golpe ou sem endereço nem CNPJ.

## Passo 3: analisar cada candidato

### 3.1 Instagram (Chrome)
Abra `https://www.instagram.com/<usuario>/` e anote: seguidores, bio, link da bio, botões de contato (WhatsApp, e-mail, ligar), destaques (catálogo, preços, "agende").

**Data do último post:** o código de cada post (`/p/<código>/`) carrega a data de publicação. Na página do perfil, rode no Chrome (javascript_tool) para ter, dos posts carregados, a data do mais recente que **não** está fixado e quantos caem nos últimos 30 dias:

```js
const alfa = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const data = (c) => { let id = 0n; for (const l of c) id = id * 64n + BigInt(alfa.indexOf(l)); return new Date(Number(id >> 23n) + 1314220021721).toISOString().slice(0, 10); };
const posts = [...document.querySelectorAll('main a[href*="/p/"], main a[href*="/reel/"]')].map((a) => ({ d: data(a.href.split("/").filter(Boolean).pop()), fixado: !!a.querySelector('svg[aria-label*="ixad"], svg[aria-label*="inned"]') }));
const datas = posts.filter((p) => !p.fixado).map((p) => p.d).sort().reverse();
({ ultimo: datas[0], em30: datas.filter((d) => (Date.now() - new Date(d)) / 864e5 <= 30).length, carregados: datas.length });
```

Na dúvida, abra o post e confira o `datetime` do elemento `time`. O `alt` das imagens da grade traz o começo da legenda: serve para achar crescimento, procedimentos e o nome do decisor sem abrir post por post. (A API interna `web_profile_info` não responde pelo navegador; use a página.)

- Último post com mais de 30 dias: `pnpm radar:lead -- descartar --instagram <usuario> --nome "<nome>" --cidade "<cidade>" --motivo "Último post em AAAA-MM-DD"` e passe para o próximo.

**Anúncios:** `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&q=<nome>&search_type=keyword_unordered` no Chrome. Anúncio ativo é evidência de `investe_divulgacao`; nada ativo também é evidência (do zero). **A busca é por palavra-chave e traz homônimos e anúncios sem relação:** só conta o anúncio cujo anunciante é a página do próprio negócio (mesmo nome, cidade e foto). Uma busca por palavra-chave pode trazer homônimos de outras cidades.

### 3.2 Site
- Link da bio é Linktree, Carrd, Beacons, encurtador que cai no WhatsApp (bit.ly, trakto.link) ou nada: busque "<nome> <cidade>" e "<nome> site" para confirmar que não existe domínio próprio. Página de botões num subdomínio gratuito (`fulano.carrd.co`) é link de bio, mesmo bonita: conta como `sem-site`. A ficha do Google com "Adicionar website" confirma.
- Encurtador (bit.ly, w.app, wa.link, shre.ink) ou arte do Canva (`canva.com/design/...`) no link da bio: resolva o destino com `curl -s -o /dev/null -w "%{redirect_url}" <url>`. Canva com botões é link de bio. O número de cada botão de WhatsApp sai do `phone=` do destino; compare com o da ficha do Google (compare a saudação automática com o nome público do negócio).
- Confira o site que a **ficha do Google** mostra, não só o link da bio: pode ser outro endereço, um Linktree ou um domínio perdido. Domínio que virou "This domain may be for sale" redireciona para anúncio no Chrome: confira com `curl`, não abra no navegador.
- **O que a mensagem cita tem de aparecer na tela.** Texto lido do código da página (innerText, curl) pode estar escondido: em 2026-10-24 o perfil fictício no bio.site tinha "Invalid Link" no HTML, invisível. Tire print da página e confirme antes de citar.
- Achou site: `pnpm radar:site -- <url> --psi` (sem `--psi` se a API recusar) e cole a saída em `site.diagnostico`, que o painel mostra. Abra o site no Chrome e olhe de verdade: visual amador, foto estourada, texto ilegível no celular, banner que demora, barra fixa cobrindo conteúdo, botão que não funciona, informação velha.
- `presenca_web.nivel`: comece pelo `situacaoSugerida` do diagnóstico e ajuste pelo que viu, dizendo o porquê na evidência.
- **Evidência tem de bater com o que está gravado:** o tempo de resposta varia entre medições. Só cite lentidão se o `site.diagnostico` gravado mostrar. HTTP 403 ou 503 costuma ser proteção contra robô, não site ruim: confira no Chrome antes.
- Site bom e nenhuma outra necessidade clara: descarte com motivo "Site bom, sem necessidade clara". Exceção: quem lança curso, mentoria ou procedimento caro sem página de vendas (oportunidade de página de vendas e VSL).

### 3.3 Google
Ficha do Google Maps (Chrome ou busca): nota, número de avaliações e o link da ficha.

### 3.4 Concorrentes
Busque "<nicho> <cidade>" e escolha 1 ou 2 concorrentes diretos com site claramente melhor. Rode o diagnóstico neles para confirmar. Sem concorrente melhor: `concorrente_melhor.ok = false`, dizendo quem foi olhado.

### 3.5 Crescimento, contato e decisor
- **Crescimento (últimos 90 dias):** nova unidade, inauguração, serviço novo, vaga aberta, reforma, lançamento. A fonte é o post ou a notícia.
- **Contato:** só o que está publicado (bio, botão do perfil, site, Google). Pelo menos um. Nunca deduza número.
- **Decisor:** nome do dono, sócio ou responsável ("Dra. Fulana", "fundador Fulano") quando aparece.

## Passo 4: avaliar os critérios

Para **cada** critério da régua:
- `ok`: atende ou não. Na dúvida, `false`.
- `evidencia`: o fato observado, com número e data quando houver, que qualquer pessoa confere abrindo a fonte. Ex.: "Último reel de 14/10 com 2,1 mil views; 11 posts entre 20/09 e 19/10". Também no `false`: "Biblioteca de Anúncios sem anúncio ativo em 19/10/2026".
- `fonte`: a URL exata onde conferir (perfil, post, site, ficha do Maps, Biblioteca de Anúncios). Obrigatória quando `ok: true`, senão o critério não pontua.
- `presenca_web` leva `nivel`: `sem-site`, `ruim`, `mediano` ou `bom`.

**Não escreva a nota.** O `pnpm radar:lead -- adicionar` calcula a partir dos critérios. Nota alta sem evidência não existe.

## Passo 5: oportunidade e abordagem

**Serviços** (`servicos`), pelo que a evidência mostra:
- Sem site, serviço local: `site` (mais `landing-page` se já anuncia).
- Anuncia e manda tudo para o WhatsApp: `landing-page`.
- Curso, mentoria, procedimento caro, lançamento: `pagina-de-vendas` e `vsl`.
- Vende produto pelo direct ou catálogo em PDF: `catalogo` ou `loja-online`.

**Problemas** (`problemas`): de 3 a 6 frases curtas, concretas e verdadeiras ("Link da bio é um Linktree com 9 botões", "Site de 2017 não abre direito no celular").

**Oportunidade** (`oportunidade`): 1 ou 2 frases. O que construir e por que isso vende mais, amarrado na evidência.

**Abordagem** (`abordagem`), no método da casa (vault: `deals/prospeccao.md`): **dar antes de pedir**. A primeira mensagem não vende, não fala preço e não pede reunião: entrega um sinal de que você olhou o negócio de verdade e pede permissão para mandar algo feito para ele (a oferta está em configuração do Radar (Supabase): uma prévia de como ficaria a página dele).
1. Cumprimento com o nome do negócio ou do decisor, e um elogio verdadeiro e específico (um post, as avaliações, a unidade nova) na mesma frase: prova que você entrou no perfil.
2. **Um** problema específico e verdadeiro, dito na língua do dono ("o link da bio cai numa lista de botões", não "falta uma landing page otimizada"). O efeito na venda só entra se couber em meia frase.
3. Apresentação e pedido de permissão juntos: "Sou o Matheus, da MF Services. Posso te mandar uma prévia de como ficaria o site de vocês?". A prévia só é feita para quem disser sim.

**Curta (pedido do Matheus em 2026-10-24: "mensagens mais curtas para a pessoa não precisar ler muito, mas a qualidade está ótima"):** 3 frases, **até 280 caracteres**, que se leem de uma olhada na tela do celular. Corte o que não muda a decisão do dono: o segundo detalhe do elogio, a explicação do problema, a frase de efeito. Mantém o que dava qualidade: o detalhe real do perfil e o problema concreto.

Regras da mensagem: 3 frases curtas, até 280 caracteres, PT-BR impecável, tom próximo e profissional. Apresente-se uma vez como "Matheus, da MF Services". Sem preço, sem jargão (SEO, conversão, responsivo), sem "tudo bem?" genérico, sem emoji em excesso (no máximo 1), **sem link** (link em mensagem fria no Direct cai no filtro de spam). Cada mensagem é única: nada de modelo com o nome trocado. **Nunca use o travessão "—"** (o script recusa).

- `canal`: `instagram`. O envio é pelo Direct do @emefeservices; o WhatsApp do lead fica só no `contato`.
- `followup`: 1 ou 2 frases para 3 dias depois, trazendo algo novo e ainda pedindo permissão ("separei os dois pontos do perfil de vocês que a prévia resolveria, posso mandar?"). Um só.

Bom:
> Oi, Dra. Ana! Vi os resultados de harmonização que vocês postaram essa semana, trabalho lindo. Reparei que o link da bio cai direto no WhatsApp, sem mostrar os procedimentos. Sou o Matheus, da MF Services: posso te mandar uma prévia de como ficaria uma página da clínica?

Ruim: "Olá, tudo bem? Sou desenvolvedor e faço sites profissionais com ótimo preço. Tem interesse?"

## Passo 6: gravar

1. Escreva o lead em `~/.local/share/radar-mf/tmp/<usuario>.json` (a pasta `~/.local/share/radar-mf/tmp/` fica fora do git), no formato do exemplo abaixo.
2. `pnpm radar:lead -- adicionar ~/.local/share/radar-mf/tmp/<usuario>.json`.
3. Erro de validação: corrija o campo que o script apontou e rode de novo. Duplicado: pule.
4. Reanálise de um lead que já existe: `pnpm radar:lead -- atualizar ~/.local/share/radar-mf/tmp/<usuario>.json`.

## Passo 6.5: pôr na fila

Lead gravado com nota igual ou acima de `envio.notaMinima` (configuração do Radar no Supabase): `pnpm radar:envio -- rascunho <id>`. A mensagem vai para a aba **Fila de envio** do painel, esperando o Matheus aprovar. Nunca aprove nem envie por ele.

## Passo 7: relatório

No fim da rodada, curto:
- Tabela: nota, nome, cidade/UF, o problema principal, serviço sugerido.
- Quantos foram descartados e por quê (inativo, site bom, fora do alvo).
- Quantos rascunhos entraram na fila para aprovar.
- "Painel: `pnpm dev`, https://emefeservices.vercel.app/radar (aba Fila de envio para aprovar)".

## Regras

- **Só dado público.** Nada de comprar lista, nada de ferramenta paga, nada de raspar dado pessoal.
- **Instagram só leitura, em ritmo de gente:** no máximo uns 40 perfis por rodada. Se o Instagram pedir verificação, mostrar aviso de limite ou deslogar, pare e avise o Matheus.
- **Nunca inventar** número, nota do Google, data ou contato. Sem evidência, `ok: false`.
- **Sem duplicado:** `existe` antes de analisar. O script também recusa.
- **LGPD:** o contato é comercial e público, para abordagem B2B. Se o lead pedir para não ser procurado: `pnpm radar:lead -- remover <id> --motivo "Pediu para não ser contatado"`.
- Leads de clientes atuais da MF Services ou de quem já recusou proposta não entram (confira no vault, `clientes/` e `deals/`, se o nome soar familiar).

## Exemplo de lead

```json
{
  "id": "lead_ficticio_001",
  "nome": "Negócio Fictício",
  "segmento": "Clínica de estética",
  "cidade": "Recife",
  "uf": "PE",
  "instagram": {
    "usuario": "lead_ficticio_001",
    "seguidores": 8400,
    "ultimoPost": "2026-10-16",
    "postsUltimos30Dias": 11,
    "linkBio": "https://wa.me/5500000000000",
    "bio": "Harmonização e estética avançada · Dra. Pessoa Fictícia · bairro fictício"
  },
  "site": {},
  "google": { "nota": 4.9, "avaliacoes": 212, "url": "https://maps.google.com/?cid=000000" },
  "contato": { "whatsapp": "0000000000" },
  "decisor": "Dra. Pessoa Fictícia",
  "problemas": [
    "Não tem site: a busca pelo nome só mostra o Instagram e a ficha do Google",
    "Link da bio leva direto ao WhatsApp, sem procedimentos, preços de referência ou depoimentos",
    "212 avaliações 4,9 no Google que ninguém vê fora do Maps"
  ],
  "oportunidade": "Landing page de procedimentos com antes e depois, as avaliações do Google e agendamento pelo WhatsApp, para os anúncios que ela já roda pararem de cair direto no chat.",
  "servicos": ["landing-page", "site"],
  "criterios": {
    "presenca_web": { "ok": true, "nivel": "sem-site", "evidencia": "Link da bio é wa.me; busca por \"Negócio Fictício Recife\" não acha domínio próprio", "fonte": "https://www.instagram.com/lead_ficticio_001/" },
    "so_insta_whats": { "ok": true, "evidencia": "Bio diz \"agende pelo WhatsApp\" e os destaques mostram os preços por direct", "fonte": "https://www.instagram.com/lead_ficticio_001/" },
    "concorrente_melhor": { "ok": true, "evidencia": "Clínica Concorrente, também em bairro fictício, tem site com procedimentos e agendamento online", "fonte": "https://competitor.example" },
    "investe_divulgacao": { "ok": true, "evidencia": "3 anúncios ativos na Biblioteca de Anúncios do Meta em 19/10/2026", "fonte": "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&q=Cl%C3%ADnica%20Exemplo" },
    "frequencia_posts": { "ok": true, "evidencia": "11 posts entre 20/09 e 16/10/2026", "fonte": "https://www.instagram.com/lead_ficticio_001/" },
    "boas_avaliacoes": { "ok": true, "evidencia": "Nota 4,9 com 212 avaliações no Google", "fonte": "https://maps.google.com/?cid=000000" },
    "valor_agregado": { "ok": true, "evidencia": "Harmonização facial e bioestimulador, procedimentos de ticket alto", "fonte": "https://www.instagram.com/lead_ficticio_001/" },
    "crescimento": { "ok": false, "evidencia": "Nenhum anúncio de unidade ou serviço novo nos últimos 90 dias" },
    "porte_ideal": { "ok": true, "evidencia": "8,4 mil seguidores", "fonte": "https://www.instagram.com/lead_ficticio_001/" },
    "decisor_identificado": { "ok": true, "evidencia": "Bio cita a Dra. Pessoa Fictícia como responsável", "fonte": "https://www.instagram.com/lead_ficticio_001/" }
  },
  "concorrentes": [
    { "nome": "Clínica Concorrente", "site": "https://competitor.example", "observacao": "Site com página por procedimento, depoimentos e agendamento online" }
  ],
  "abordagem": {
    "canal": "instagram",
    "mensagem": "Oi, Dra. Ana! Vi os resultados de harmonização que vocês postaram essa semana, trabalho lindo. Reparei que o link da bio cai direto no WhatsApp, sem mostrar os procedimentos. Sou o Matheus, da MF Services: posso te mandar uma prévia de como ficaria uma página da clínica?",
    "followup": "Dra. Ana, fiz um rascunho rápido da página com os procedimentos e as avaliações de vocês no Google. Quer que eu mande por aqui?"
  },
  "analisadoEm": "2026-10-19",
  "fontes": [
    "https://www.instagram.com/lead_ficticio_001/",
    "https://maps.google.com/?cid=000000",
    "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&q=Cl%C3%ADnica%20Exemplo"
  ]
}
```
