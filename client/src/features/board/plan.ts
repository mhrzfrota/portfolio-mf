import type { BoardState } from "./types";

/**
 * Plano comercial em forma de board, derivado de:
 * - docs/marketing/2026-08-10-analise-e-comercial-mf.md (escada de ofertas, pitch, canais)
 * - docs/marketing/2026-08-11-inventario-de-ativos.md (achados da auditoria externa)
 * - docs/brand/2026-07-29-nova-comunicacao-mf.md (voz e posicionamento)
 *
 * Ids fixos e legíveis de propósito: o arquivo é versionado, então o diff mostra
 * qual cartão mudou. Ao carregar no board eles viram dados normais, editáveis e
 * arrastáveis como qualquer outro.
 */
export function planBoard(): BoardState {
  return {
    lists: [
      {
        id: "list-semana",
        title: "Esta semana",
        cards: [
          {
            id: "c-como-usar",
            text: `Como usar este board

Clique no círculo para marcar como concluído.
Clique no cartão para abrir e editar o texto.
Arraste para "Fazendo" quando começar e para "Feito" quando acabar.
A ordem das colunas é a ordem de execução — comece pelo topo desta.
Tudo fica salvo só neste navegador.`,
          },
          {
            id: "c-typo-bio",
            text: `Corrigir "Portóflio" no bio.site (1 min)

Em bio.site/mfservices o card do portfólio está escrito "Matheus Frota - Portóflio".
É o primeiro texto que alguém do Instagram lê sobre você.`,
          },
          {
            id: "c-link-insta",
            text: `Apontar o Instagram do bio.site para @emefeservices (1 min)

Hoje ele manda para @matheuslfrota: conta pessoal, privada, 85 seguidores.
Quem clica bate numa porta fechada. A conta profissional tem 1.577.`,
          },
          {
            id: "c-bio-insta",
            text: `Reescrever a bio do @emefeservices (5 min)

Hoje: "software developer | SaaS apps and client projects" — inglês, falando com dev.
Seu cliente é dono de PME brasileiro. Sugestão, na sua voz:

"Sites e sistemas para empresas que vendem bem — e perdem tempo no manual.
Fortaleza/CE · atendo remoto. Me chame no WhatsApp 👇"`,
          },
          {
            id: "c-dep-lopes",
            text: `Pedir depoimento — Lopes Veículos

Alavanca nº 1 da análise inteira: probabilidade percebida está em 4/10 por falta de prova.
Peça áudio no WhatsApp e transcreva. Duas frases bastam.

"Fulano, tudo bem? Preciso de um favor rápido: pode me mandar um áudio de 30s
contando como era antes do sistema e como está hoje? Vou usar no meu site."`,
          },
          {
            id: "c-dep-fenix",
            text: `Pedir depoimento — Montadora Fênix

Mesmo pedido, mesmo formato de áudio.
Fênix prova "presença que vende"; Lopes prova "tempo devolvido". São ângulos diferentes.`,
          },
          {
            id: "c-dep-terceiro",
            text: `Pedir depoimento — Via Shopping Car ou TZ Produções

O terceiro depoimento. Escolha o cliente com quem a relação é mais fácil —
o objetivo é ter 3 na mão até o fim da semana, não escolher o perfeito.`,
          },
          {
            id: "c-num-lopes",
            text: `Perguntar o número da Lopes

"Quantas horas por semana vocês economizaram desde que o cadastro virou um só?"
Estimativa honesta do cliente serve. Sem número, o case é história; com número, é prova.`,
          },
          {
            id: "c-num-fenix",
            text: `Perguntar o número da Fênix

"Quantos contatos por mês chegam pelo site hoje?"
Dois cases com número já mudam a conversa de preço.`,
          },
          {
            id: "c-link-morto",
            text: `Resolver o case com link morto

"Landing Page E-book Virtual" aponta para albertocid.com.br — o domínio não existe mais.
O botão "Ver no ar" leva a lugar nenhum.
Opções: remover o case, tirar só o link (deixar como estudo de caso) ou republicar uma cópia.`,
          },
        ],
      },
      {
        id: "list-quinzena",
        title: "Próximas 2 semanas",
        cards: [
          {
            id: "c-testar-prazo",
            text: `Testar o prazo de 14 dias antes de prometer

Cronometre o próximo site do começo ao fim, com atrasos de cliente incluídos.
A garantia da oferta de entrada se apoia nesse prazo — prazo quebrado destrói a garantia.
Faça isto ANTES de publicar o nome da oferta.`,
          },
          {
            id: "c-oferta-entrada",
            text: `Nomear a oferta de entrada no site

"Site que Vende em 14 Dias" no lugar do card genérico "Presença Digital".
Precisa aparecer: escopo fechado, prazo, os 3 bônus, a garantia de marco
(layout aprovado na 1ª semana ou devolvo o sinal) e a capacidade real do mês.`,
          },
          {
            id: "c-oferta-principal",
            text: `Nomear o projeto principal no site

"Operação sem Planilha" no lugar de "Operação & Dados" / "Produto Completo".
Sprint de 30–60 dias. Semana 1 é diagnóstico pago com mapa do processo:
se o cliente não seguir, fica com o mapa. Prova âncora: Lopes Veículos.`,
          },
          {
            id: "c-recorrencia",
            text: `Definir a "Evolução Contínua"

Mensalidade pós-projeto: monitoramento, ajustes e relatório simples do mês.
Definir o que entra, quantas horas e o preço.
Regra: só oferecer na ENTREGA do projeto, nunca antes.`,
          },
          {
            id: "c-aplicar-preco",
            text: `Aplicar a decisão de preço no site

Depende do cartão de decisão sobre a âncora (coluna Decisões).
Hoje "a partir de R$ 500" puxa a percepção das três soluções para baixo
e atrai justamente a anti-persona.`,
          },
          {
            id: "c-instrumentar",
            text: `Instrumentar a conversão no Umami

O Umami já está no site, mas só conta pageview — zero eventos.
Você não sabe quantas visitas viram conversa.
Marcar os CTAs de WhatsApp (hero, topbar, rodapé, contato) com data-umami-event.
Me peça que eu faço — é rápido.`,
          },
          {
            id: "c-proposta",
            text: `Montar o template de proposta de 1 página

Nesta ordem: o que travava (nas palavras do cliente) → o que muda (tempo/venda)
→ como (escopo fechado, o que não entra, prazo) → prova (1 case do nicho + link)
→ garantia → investimento (preço fechado, pagamento, validade de 14 dias).`,
          },
          {
            id: "c-biosite",
            text: `Reformular o bio.site inteiro

Hoje é um diretório com tagline "Soluções digitais" — não diz nada e não prova nada.
Deve ter: a frase de posicionamento, 1 case com número, a oferta nomeada
e o WhatsApp como ação principal.`,
          },
          {
            id: "c-google-business",
            text: `Criar o Google Business

Quem procura "criar site em Fortaleza" precisa te achar.
Você vende presença digital: a sua própria tem que ser o primeiro case.
É também um dos bônus prometidos na oferta de entrada — bom você ter feito o seu.`,
          },
        ],
      },
      {
        id: "list-prospeccao",
        title: "Prospecção (rodar sempre)",
        cards: [
          {
            id: "c-meta",
            text: `Definir a meta semanal e escrever aqui

Quantos contatos novos por semana? Quantos projetos por mês você aguenta?
Sem número, prospecção vira "quando sobrar tempo" — e nunca sobra.
A capacidade real também é a sua escassez honesta na oferta.`,
          },
          {
            id: "c-automotivo",
            text: `Nicho automotivo: 3 lojas por semana

Você tem 3 cases no setor (Lopes, Via Shopping Car, Fênix).
Toda loja de veículos de Fortaleza tem o mesmo problema: anúncio no braço, estoque em planilha.
Liste 10 lojas, olhe o site e o Instagram de cada uma, anote o que está travando.`,
          },
          {
            id: "c-msg-indicacao",
            text: `Mensagem de indicação (usar como está)

"Olá, [nome]! O [indicador] comentou que você [contexto]. Sou o Matheus —
desenvolvi o site e o sistema da Lopes Veículos. Antes de falar de qualquer
proposta: olhei a presença digital de vocês e separei os 3 pontos que mais
estão custando venda. Posso te mandar por aqui?"

Faça a análise ANTES de mandar. É o que ninguém mais faz.`,
          },
          {
            id: "c-msg-reativacao",
            text: `Mensagem de reativação / rede

"[Nome], tudo bem? Estou com 1 vaga de projeto abrindo em [mês].
Lembrei de você porque [motivo verdadeiro]. Se fizer sentido, me conta como está
a operação hoje — em 15 minutos te digo o que dá pra automatizar e o que não vale a pena."

Só use a vaga se ela existir de verdade.`,
          },
          {
            id: "c-agencias",
            text: `Parceria com agências (o canal de maior alavanca)

Agências de marketing locais não têm dev. Você já vive isso na MSL.
Proposta: braço técnico white-label (dashboards, LPs, automações).
1 agência = fluxo contínuo, sem você prospectar cliente final.
Comece pela MSL e por quem você já conhece do tempo de tráfego pago.`,
          },
          {
            id: "c-pedir-indicacao",
            text: `Pedir indicação na entrega de TODO projeto

No momento do "obrigado", que é quando a satisfação está no pico:
"Conhece um dono de empresa que sofre com isso? Uma apresentação vale muito pra mim."
Pedir o depoimento na mesma hora.`,
          },
          {
            id: "c-roteiro-conversa",
            text: `Roteiro da primeira conversa

1. Entender — como vende, onde trava, o que consome tempo (70% da conversa).
2. Desenhar — repetir o problema com as palavras dele, propor o próximo passo.
3. Só depois, proposta.

Nunca falar preço antes de nomear o problema.`,
          },
        ],
      },
      {
        id: "list-conteudo",
        title: "Conteúdo",
        cards: [
          {
            id: "c-formato",
            text: `O formato único: travava → construí → mudou

Todo post segue o mesmo arco dos seus cases.
O texto já existe no site — é reaproveitar, não escrever do zero.
1.577 pessoas no @emefeservices já te seguem: o ativo existe, falta usar.`,
          },
          {
            id: "c-cadencia",
            text: `Definir a cadência e escrever aqui

1 post por semana sustentado vale mais que 5 numa semana e nada por um mês.
Escolha o dia e trate como compromisso.`,
          },
          {
            id: "c-post-lopes",
            text: `Post — Lopes Veículos

"O carro entra no pátio, aparece no site e vai pra OLX no mesmo fluxo."
É o seu case mais forte: prova tempo devolvido e integração real.
Se conseguir o número de horas economizadas, ele abre o post.`,
          },
          {
            id: "c-post-fenix",
            text: `Post — Montadora Fênix

"Vinte anos de stands impecáveis — e um site que não mostrava isso."
Prova presença que vende. Bom para o público que se envergonha do próprio site.`,
          },
          {
            id: "c-post-msl",
            text: `Post — Dashboard Meta Analytics (MSL)

Decidir com dados em vez de no escuro.
É o post que conversa com agências — o canal de parceria mora aqui.`,
          },
          {
            id: "c-post-via",
            text: `Post — Via Shopping Car

"Um shopping de carros inteiro, invisível para quem pesquisava online."
Reforça o nicho automotivo, que é a sua cabeça de ponte na prospecção.`,
          },
          {
            id: "c-post-historia",
            text: `Post — a sua história (o diferencial que ninguém copia)

3 anos e meio gerindo tráfego pago numa loja de veículos ANTES de programar —
e depois você construiu o sistema da mesma loja.
É a prova biográfica de "entende o negócio primeiro". Poucos têm isso.`,
          },
          {
            id: "c-linkedin",
            text: `Espelhar no LinkedIn

Mesmo post, sem adaptação criativa.
No LinkedIn moram as agências e os donos de empresa maiores.`,
          },
        ],
      },
      {
        id: "list-decisoes",
        title: "Decisões",
        cards: [
          {
            id: "c-dec-diagnostico",
            text: `DECIDIR: o que substitui o Diagnóstico IA

Você removeu o Diagnóstico do site em 11/08. Ele era o degrau grátis da escada
e aparece no pitch, nas 2 mensagens de prospecção e nos bônus da oferta de entrada.
Sem substituto, esse material promete algo que não existe.

Opções:
a) Refazer a ferramenta.
b) Você mesmo fazer a análise, em 1 página, sob demanda. ← recomendo
c) Assumir a escada sem degrau grátis.

(b) custa zero código, prova melhor o "entende o negócio" e é mais difícil de copiar.
Enquanto não decidir, os scripts de prospecção ficam bloqueados.`,
          },
          {
            id: "c-dec-preco",
            text: `DECIDIR: a âncora de preço

Hoje: "a partir de R$ 500". Puxa as três soluções para baixo e atrai quem quer
"site de R$ 300 pra ontem" — a sua anti-persona declarada.

Opções: preço fechado por oferta nomeada a partir de R$ 1.500, ou tirar o preço
e vender a conversa. Dá pra manter a honestidade de preço com âncora mais alta.`,
          },
          {
            id: "c-dec-capacidade",
            text: `DECIDIR: sua capacidade real por mês

Quantos projetos de entrada e quantos grandes cabem no seu mês, com o trabalho na MSL?
Esse número vira a escassez honesta da oferta ("2 vagas por mês").
Escassez inventada destrói confiança — então precisa ser o número verdadeiro.`,
          },
          {
            id: "c-dec-meta",
            text: `DECIDIR: a meta de negócio

O product-marketing.md está com "[confirmar meta numérica]".
Quantos projetos por mês? Qual faturamento? Quanto de recorrência até dezembro?
Sem meta, não dá pra saber se o plano funcionou.`,
          },
          {
            id: "c-dec-confirmar",
            text: `Fechar os [confirmar] do product-marketing.md

Ficaram 4 pontos em aberto: existe retainer hoje, termos de suporte pós-entrega,
verbatim real de cliente e a meta numérica.
Depois de coletar os depoimentos, dá pra fechar quase todos de uma vez.`,
          },
        ],
      },
      { id: "list-fazendo", title: "Fazendo", cards: [] },
      { id: "list-feito", title: "Feito", cards: [] },
    ],
  };
}
