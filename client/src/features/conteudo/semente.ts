import type { AnguloId, EtapaId, Estudio, FormatoId, GrupoNota, Metricas, Nota, Peca, Profundidade, Tematica } from "./estudio.ts";

/**
 * Primeira carga do estúdio: o que o vault já tinha de conteúdo (estratégia,
 * banco de ideias, narrativas, posts com roteiro, Insights de 14/11 e o método
 * de conteúdo documentativo), organizado em temáticas, peças e notas.
 * Só entra quando a conta ainda não tem estúdio salvo.
 */

const DIA = "2026-11-17";
const vazias = (): Metricas => ({
  visualizacoes: null, alcance: null, curtidas: null, comentarios: null,
  salvamentos: null, compartilhamentos: null, visitasPerfil: null, seguidores: null,
});

const TEMATICAS: Tematica[] = [
  {
    id: "t-improviso", nome: "Do improviso ao sistema", cor: "#0C2AFE",
    cliente: "Dono de pequena e média empresa que toca a operação no WhatsApp, na planilha e no caderno. Faz a mesma coisa duas vezes, perde informação e apaga incêndio em vez de vender.",
    eu: "Transformo rotina manual em sistema sob medida, com IA onde ajuda. Provas: Villa's Flow (9 pessoas, 6 setores fora da planilha), Sistema LV (carro cadastrado uma vez, sai no site e na OLX).",
  },
  {
    id: "t-site", nome: "Site que vende", cor: "#30D158",
    cliente: "Negócio local que não aparece quando o cliente procura, ou tem um site bonito que não gera conversa. Vende pelo WhatsApp e paga taxa de marketplace.",
    eu: "Sites, catálogos e lojas com pagamento (InfinitePay) que levam direto para a conversa. Barreto Fit, Lyre Store, TS Kite Center, Monique Almeida Advocacia.",
  },
  {
    id: "t-veiculos", nome: "Revenda de veículos", cor: "#FF9F0A",
    cliente: "Loja de carros com estoque espalhado entre OLX, Instagram e planilha, e lead que chega sem saber qual carro quer.",
    eu: "Vertical mais funda da casa: Sistema LV, Lopes Premium Car, Car Store, Via Shopping Car e os anúncios da Lopes (conversa real a R$ 8,75).",
  },
  {
    id: "t-ia", nome: "IA no trabalho", cor: "#BF5AF2",
    cliente: "Dono e profissional que já ouviu falar de IA, testou o ChatGPT e não viu ganho de verdade na rotina.",
    eu: "Uso Claude e Codex juntos com um segundo cérebro no Obsidian: a IA já sabe quem é o cliente, o que foi feito e como eu trabalho. Aula do Atrium.",
  },
  {
    id: "t-bastidor", nome: "Bastidor de quem constrói", cor: "#64D2FF",
    cliente: "Quem vai contratar e quer confiar: ver como a coisa é feita, o que dá errado e como é resolvido.",
    eu: "22 projetos, erros reais documentados (projetos perdidos, sistema esquecido), checklist antes de entregar, processo de referência visual.",
  },
  {
    id: "t-disciplina", nome: "Disciplina e esporte", cor: "#FF453A",
    cliente: "Identificação: a pessoa por trás do dev. Quem treina segue quem treina; academia de luta também é cliente.",
    eu: "Jiu-jitsu como base, mais surf, corrida, academia e futebol. Site da Gigueto Jiu-Jitsu e o BJJ Control. Detalhe concreto do treino antes de qualquer paralelo.",
  },
];

type Base = {
  id: string; titulo: string; tematica: string; angulo: AnguloId | ""; profundidade: Profundidade | "";
  formato: FormatoId | ""; gancho?: string; roteiro?: string; legenda?: string; data?: string; link?: string;
  metricas?: Partial<Metricas>; checklist?: string[];
};

const p = (etapa: EtapaId, b: Base): Peca => ({
  id: b.id, etapa, titulo: b.titulo, tematica: b.tematica, angulo: b.angulo, profundidade: b.profundidade,
  formato: b.formato, gancho: b.gancho ?? "", roteiro: b.roteiro ?? "", legenda: b.legenda ?? "",
  data: b.data ?? "", link: b.link ?? "", metricas: { ...vazias(), ...b.metricas },
  checklist: (b.checklist ?? []).map((texto, i) => ({ id: `${b.id}-c${i + 1}`, texto, feito: false })),
  criadoEm: DIA, atualizadoEm: DIA, publicadoEm: etapa === "publicado" ? (b.data ?? DIA) : "",
});

const IDEIAS: Base[] = [
  { id: "p-7proc-reel", titulo: "7 processos em Reel, com o rosto", tematica: "t-improviso", angulo: "sacada", profundidade: "raso", formato: "reel",
    gancho: "Sua empresa ainda faz isso na mão?",
    roteiro: "Mesmo tema do carrossel de 13/11, agora com você na câmera (o Reel com rosto foi o único formato que saiu da base de seguidores).\n\nO que eu percebi:\nPor que importa:\nO que fazer:" },
  { id: "p-7proc-serie", titulo: "Série: um carrossel por processo, com caso real", tematica: "t-improviso", angulo: "analise", profundidade: "profundo", formato: "carrossel",
    roteiro: "Pegar cada um dos 7 processos do carrossel de 13/11 e contar o caso real em que ele saiu do improviso.\n\nO que eu vi:\nMinha leitura:\nO que se tira disso:" },
  { id: "p-quanto-custa", titulo: "Quanto custa um site? Por que ninguém te responde", tematica: "t-site", angulo: "faq", profundidade: "raso", formato: "carrossel",
    gancho: "Você pediu o preço de um site e ninguém te respondeu. Eu respondo.",
    roteiro: "Post de objeção: tende a ter muito salvamento.\n\nA pergunta:\nA resposta direta:\nO próximo passo:" },
  { id: "p-pergunta-cliente", titulo: "Série \"Pergunta de cliente\"", tematica: "t-site", angulo: "faq", profundidade: "raso", formato: "carrossel",
    roteiro: "Uma dúvida real ouvida na semana, respondida em carrossel. Formato recorrente." },
  { id: "p-pc-cai", titulo: "Seu site funciona no seu PC e cai no ar. Por quê?", tematica: "t-bastidor", angulo: "analise", profundidade: "profundo", formato: "carrossel",
    roteiro: "O caso do manualChunks circular que derrubou produção (Aprendizados Técnicos). Contraintuitivo, bom para salvar." },
  { id: "p-carrossel-dedo", titulo: "O carrossel do seu site prende o dedo do cliente", tematica: "t-site", angulo: "sacada", profundidade: "raso", formato: "reel",
    roteiro: "Scroll latching no celular: dor que todo mundo já sentiu e ninguém sabe nomear. Gravar a tela antes e depois." },
  { id: "p-foto-card", titulo: "Não corte a foto pro card. Adapte o card pra foto.", tematica: "t-bastidor", angulo: "sacada", profundidade: "raso", formato: "carrossel",
    roteiro: "Detalhe de ofício que se repete em todo projeto. Antes e depois lado a lado." },
  { id: "p-sistema-esquecido", titulo: "Construí um sistema completo e esqueci que ele existia", tematica: "t-bastidor", angulo: "historia", profundidade: "profundo", formato: "reel",
    gancho: "Construí um sistema completo de gestão de academia. Ele tem um aluno cadastrado: eu.",
    roteiro: "BJJ Control: graduação por faixa, QR code, mensalidade. 1 aluno e 0 presenças.\n\nContexto:\nConflito:\nVirada:" },
  { id: "p-projetos-perdidos", titulo: "Descobri que perdi nove projetos", tematica: "t-bastidor", angulo: "historia", profundidade: "profundo", formato: "reel",
    gancho: "Descobri que perdi nove projetos. Só percebi porque resolvi organizar.",
    roteiro: "As 7 pastas de campanha e a Montadora Fênix sumiram do disco. Leva direto ao segundo cérebro.\n\nContexto:\nConflito:\nVirada:" },
  { id: "p-mesma-entrega", titulo: "Fiz a mesma entrega duas vezes no mesmo mês", tematica: "t-improviso", angulo: "historia", profundidade: "profundo", formato: "carrossel",
    gancho: "Fiz a mesma entrega duas vezes no mesmo mês. A segunda levou um terço do tempo.",
    roteiro: "LP Érika Amorim: 6 dias, 43 mensagens, 19 versões. LP Laís Nunes com template: 2 dias, 4 mensagens.\n\nContexto:\nConflito:\nVirada:" },
  { id: "p-mesmo-problema", titulo: "Duas empresas, o mesmo problema, e nenhuma sabia o nome", tematica: "t-improviso", angulo: "analise", profundidade: "profundo", formato: "carrossel",
    gancho: "Duas empresas de setores diferentes me contrataram para o mesmo problema, e nenhuma das duas sabia nomeá-lo.",
    roteiro: "MSL Planner e Villa's Flow: fluxo de demanda com aprovação e papéis. O post que reposiciona de \"faço sites\" para \"resolvo fluxo\"." },
  { id: "p-ia-nao-como-pensa", titulo: "Eu uso IA pra trabalhar. Não do jeito que você pensa.", tematica: "t-ia", angulo: "opiniao", profundidade: "raso", formato: "reel",
    roteiro: "Minha posição:\nPor quê:\nO que eu faço no lugar:" },
  { id: "p-ifood", titulo: "Copiei o iFood de propósito", tematica: "t-site", angulo: "opiniao", profundidade: "raso", formato: "carrossel",
    roteiro: "Bom na Brasa: quando imitar o padrão consagrado é a decisão certa, não preguiça." },
  { id: "p-terca-bastidor", titulo: "Série \"Terça de bastidor\"", tematica: "t-bastidor", angulo: "rotina", profundidade: "raso", formato: "stories",
    roteiro: "Um projeto nascendo, toda semana. Grava a tela enquanto trabalha; custo quase zero." },
  { id: "p-checklist-entrega", titulo: "Meu checklist antes de entregar um site", tematica: "t-bastidor", angulo: "rotina", profundidade: "raso", formato: "carrossel",
    roteiro: "Ortografia, mobile, favicon, brechas de segurança. Lista para salvar." },
  { id: "p-faixa-branca", titulo: "Faixa branca não escolhe a posição, ela reage", tematica: "t-disciplina", angulo: "reflexao", profundidade: "raso", formato: "reel",
    roteiro: "Detalhe concreto do treino primeiro. Depois o paralelo: escolher o jogo é o que muda de nível, no tatame e no trabalho.\n\nO pensamento:\nDe onde veio:\nO que mudou em mim:" },
  { id: "p-gigueto", titulo: "Bastidor do site da Gigueto Jiu-Jitsu", tematica: "t-disciplina", angulo: "rotina", profundidade: "raso", formato: "reel",
    roteiro: "O único post que junta tech, esporte e negócio local. Post ponte do mês." },
];

const ROTEIRO: Base[] = [
  { id: "p-pov", titulo: "Reel: site por fora, sistema por dentro (POV)", tematica: "t-improviso", angulo: "rotina", profundidade: "raso", formato: "reel",
    gancho: "Você me chamou para criar o site da sua empresa",
    roteiro: "12 a 15 s, vídeo contínuo de fundo, telas reais entrando como cartões.\n0 a 2,5 s: \"Você me chamou para criar o site da sua empresa\"\n2,5 a 6 s: três a cinco sites reais rolando\n6 a 8 s: \"Mas você também precisava de um sistema\"\n8 a 12 s: painéis, estoque e gestão de demandas\n12 a 15 s: \"Um site para seus clientes. Um sistema para sua equipe.\"\n\nRoteiro completo: conteudo/post-2026-11-11-pov-digital-negocio.md",
    link: "https://www.instagram.com/p/DfVewyPsIf-/", checklist: ["Gravar o vídeo de fundo", "Separar 5 telas de sites e 3 de sistemas", "Editar no ritmo da batida", "Legenda com palavra para comentar"] },
  { id: "p-segundo-cerebro", titulo: "Reel: a IA que já sabe tudo sobre o meu trabalho", tematica: "t-ia", angulo: "rotina", profundidade: "profundo", formato: "reel",
    gancho: "Eu não explico mais nada para a IA. Ela já sabe.",
    roteiro: "0 a 3 s: rosto na câmera, corte para o Maestri com dois terminais.\n3 a 12 s: conversa comum com IA dando resposta genérica.\n12 a 25 s: Obsidian, o graph girando, o CLAUDE.md.\n25 a 40 s: o Claude gravando sozinho no vault.\n\nOutros ganchos para testar:\n\"Minha IA lembra de todo cliente que eu já atendi. A sua esquece tudo a cada conversa.\"\n\"Coloquei duas IAs para trabalhar juntas e a diferença não foi a IA.\"\n\nRoteiro completo: conteudo/2026-11-10-video-segundo-cerebro.md" },
  { id: "p-memoria", titulo: "Escreve uma vez, usa o ano inteiro (memória no Obsidian)", tematica: "t-ia", angulo: "sacada", profundidade: "raso", formato: "carrossel",
    gancho: "Toda vez que você abre uma conversa nova com a IA, ela não sabe nada sobre você.",
    roteiro: "A conta de quanto custa reexplicar contexto toda vez. Legenda pronta em conteudo/post-memoria-obsidian.md." },
  { id: "p-5-motivos", titulo: "5 motivos para ter um site", tematica: "t-site", angulo: "faq", profundidade: "raso", formato: "carrossel",
    gancho: "Seu cliente procurou seu negócio hoje. E achou o concorrente.",
    roteiro: "Fala com quem não tem site.\n1. Quem procura já está com dinheiro na mão\n...\nSlides completos em conteudo/post-5-motivos-para-ter-site.md" },
  { id: "p-case-lopes", titulo: "Case: o estoque que morava na OLX", tematica: "t-veiculos", angulo: "historia", profundidade: "profundo", formato: "carrossel",
    gancho: "O estoque dessa loja morava na OLX.",
    roteiro: "Lopes Premium Car: painel como dono da verdade, carro cadastrado uma vez, sem foto não entra no site.\nSlides em conteudo/post-case-lopes-premium-car.md",
    checklist: ["Autorização do cliente para usar o nome"] },
  { id: "p-monique", titulo: "O escritório que parecia menor do que é", tematica: "t-site", angulo: "rotina", profundidade: "raso", formato: "reel",
    gancho: "Hero parado: a foto dela e a OAB",
    roteiro: "Gravar no celular navegando em moniquealmeida.adv.br. 25 s, sem narração. O momento do mapa com a fachada deve respirar.\nRoteiro em conteudo/post-2026-09-01.md" },
];

const PRONTO: Base[] = [
  { id: "p-ranking", titulo: "Ranking das linguagens para tirar uma empresa do improviso", tematica: "t-improviso", angulo: "opiniao", profundidade: "raso", formato: "carrossel",
    gancho: "As melhores linguagens para tirar uma empresa do improviso. Spoiler: a nº 1 não é Python.",
    roteiro: "#3 SQL, a memória da empresa. #2 Python, a rotina que roda sozinha. #1 TypeScript, uma língua só do site ao sistema. Fechamento: nenhum dono de empresa me pediu uma linguagem.\n5 PNG prontos em conteudo/post-ranking-linguagens/",
    checklist: ["Revisar os slides", "Escolher a data"] },
];

const PUBLICADO: Base[] = [
  { id: "p-7proc", titulo: "7 processos que sua empresa ainda faz na mão", tematica: "t-improviso", angulo: "sacada", profundidade: "raso", formato: "carrossel", data: "2026-11-13",
    roteiro: "Lido em 22 h (14/11): 88% do alcance foi de seguidores. Retenção por slide boa; quase ninguém salvou.\nPróximo: fechar com motivo para salvar ou enviar e palavra para comentar.",
    metricas: { visualizacoes: 1165, alcance: 343, curtidas: 44, comentarios: 11, salvamentos: 1, compartilhamentos: 2, visitasPerfil: 7, seguidores: 0 },
    checklist: ["Responder os 11 comentários", "Leitura de 7 dias em 20/11"] },
  { id: "p-projetos-reais", titulo: "Quanto mais eu crio projetos reais", tematica: "t-bastidor", angulo: "reflexao", profundidade: "raso", formato: "reel", data: "2026-05-24",
    roteiro: "O melhor post da conta: Reel com o rosto. 79% de não seguidores e 11 seguidores novos, o único post que trouxe seguidor.",
    metricas: { visualizacoes: 5077, curtidas: 267, comentarios: 41, salvamentos: 11, compartilhamentos: 15, seguidores: 11 } },
];

const n = (id: string, grupo: GrupoNota, titulo: string, texto: string, fixada = false): Nota => ({ id, grupo, titulo, texto, fixada, atualizadoEm: DIA });

const NOTAS: Nota[] = [
  n("n-metodo", "metodo", "O caminho de uma peça", `Temática → ângulo → profundidade → roteiro → calendário → acervo.

1. Temática: o encontro entre o que o cliente vive e o que eu faço. Se o encontro estiver errado, o resto fica bem feito sobre o assunto errado.
2. Ângulo: a mesma temática rende dezenas de peças. Trocar de ângulo é trocar o jeito de olhar, não o assunto. São 7: Sacada, Rotina, Análise, FAQ, Opinião, Reflexão e História.
3. Profundidade: raso traz gente nova (carrossel curto, frase, sacada). Profundo constrói autoridade e vende (mini aula, vídeo longo, case). Um mês saudável tem os dois.
4. Roteiro: começo que fisga, meio que desenvolve, fim que conclui. A substância vem de mim; a IA organiza e lapida.
5. Calendário: planejar a semana ou o mês, nunca três meses. Tira a decisão do calor do momento.
6. Acervo: cada peça publicada é prova pública de competência. O cliente chega querendo a mim, não só curioso.

Fonte: guia de conteúdo documentativo do Nicolas Nunes (onicolasnunes.com/guia), lido em 2026-11-17.`, true),
  n("n-ciclo", "metodo", "Revisão do ciclo (toda semana)", `Depois de cada semana publicada, responder:
- Qual peça saiu mais fácil de fazer?
- Qual a audiência respondeu melhor (salvou, enviou, comentou, chamou no Direct)?
- Qual deu menos trabalho e mais resultado?
- Algum ângulo ainda não testado?
- O que muda na próxima semana?

No começo, testar os 7 ângulos. Com o tempo, ficam os que são mais naturais para mim.`),
  n("n-ritmo", "metodo", "Ritmo combinado", `Meta mínima: 1 Reel com o rosto e 1 carrossel por semana, mais Stories todo dia útil (enquete ou caixinha).
Houve 3 buracos de 35 a 52 dias sem post: constância vale mais que peça perfeita.
Gravar em lote: um sábado de gravação abastece o mês. Reel de tela sai enquanto trabalho.`),
  n("n-posicionamento", "posicionamento", "Do improviso ao sistema", `Palavra a possuir: improviso.

Declaração: para donos de pequenas e médias empresas que ainda tocam a operação no improviso (WhatsApp, planilha, caderno, retrabalho), a MF Services transforma essa rotina em sistema sob medida, com IA onde ela ajuda, e mostra algo funcionando antes de você contratar.

Filtro de toda peça: mostra uma rotina saindo do improviso, com algo funcionando na tela?

Não vendo site: vendo o fim de um retrabalho.`, true),
  n("n-pilares", "posicionamento", "Pilares e peso", `Tech (cases, bastidor, informativo): o pilar que vende.
Dev pessoal (organização, IA, o que 20+ projetos ensinaram): autoridade sem falar de código.
Esporte (jiu-jitsu no núcleo): tempero. Stories e um post ponte por mês.

Decisão de 15/10: posicionamento A (sistemas para empresas) com a linguagem de B (site para negócio local) como porta de entrada.`),
  n("n-perfil", "posicionamento", "Perfil: o que falta arrumar", `De 467 visitas ao perfil em 30 dias, só 19 tocaram no link (4%).
- Bio dizendo para quem, o que entrega e a chamada. Ex.: "Sistemas e sites para negócio local · Fortaleza · chama no WhatsApp"
- Link direto para o WhatsApp
- 3 fixados: um caso, o que eu faço, quem eu sou
- Destaques: Casos, Serviços, Contato
- Foto de rosto`),
  n("n-voz", "voz", "Regras de voz", `- Nunca usar o travessão. Vírgula, dois-pontos, parênteses ou ponto.
- O número concreto vence o adjetivo. "Sete campanhas em 27 dias" convence; "trabalhei muito" não.
- Uma ideia por post. Se tem duas, são dois posts.
- Detalhe concreto antes do paralelo. Sem o detalhe do treino, vira frase de camiseta.
- Chamada suave, sempre no fim. Nunca em post de esporte ou pessoal.
- Revisar ortografia sempre: é comunicação para fora.
- Sem cara de texto de IA: nada de "não é X, é Y", nada de lista de três negações, nada de pergunta respondida por mim mesmo.
- Cliente com nome só depois da autorização dele.`, true),
  n("n-ganchos", "ganchos", "Ganchos que já escrevi", `- "Eu não explico mais nada para a IA. Ela já sabe."
- "Construí um sistema completo de gestão de academia. Ele tem um aluno cadastrado: eu."
- "Descobri que perdi nove projetos. Só percebi porque resolvi organizar."
- "Fiz a mesma entrega duas vezes no mesmo mês. A segunda levou um terço do tempo."
- "Duas empresas de setores diferentes me contrataram para o mesmo problema, e nenhuma sabia nomeá-lo."
- "Seu cliente procurou seu negócio hoje. E achou o concorrente."
- "O estoque dessa loja morava na OLX."
- "Você me chamou para criar o site da sua empresa."`),
  n("n-formulas", "ganchos", "Fórmulas de gancho", `Curiosidade: "[Resultado] quase sempre vem de [causa específica e surpreendente]."
História: "Semana passada, [algo inesperado] aconteceu." / "Eu quase [erro grande]."
Valor: "Como [resultado] sem [dor comum]." / "[Número] [coisas] que [resultado]."
Contrário: "[Conselho comum] me custou [resultado]." / "Parei de [prática comum] e [resultado]."

Regra dos 3 segundos no Reel: imagem, fala e texto na tela batendo juntos no primeiro segundo.`),
  n("n-fechamentos", "ganchos", "Fechamentos que geram ação", `Pergunta aberta quase ninguém responde (13/11). Melhor:
- Motivo para salvar: "Salva para conferir na sua empresa."
- Motivo para enviar: "Manda para quem ainda faz isso na mão."
- Palavra para comentar: "Comenta SISTEMA que eu te mando como resolver o seu." E a conversa segue no Direct.`),
  n("n-arco1", "narrativas", "Do emprego para a própria casa", `CLT na MSL (três sistemas e sete LPs de campanha em 27 dias) e hoje a MF Services com carteira própria.
O ângulo honesto: o que o emprego deu (volume, prazo real, sistema de porte) e o que só a casa própria dá (escolher cliente, precificar, decidir o que construir). Sem demonizar o emprego.
Cuidado: candidato da MSL não é cliente da MF.`),
  n("n-arco2", "narrativas", "A entrega que virou produto", `LP Érika Amorim: 6 dias, 43 mensagens, 19 versões. LP Laís Nunes com template: 2 dias, 4 mensagens. Mesmo mês, mesmas mãos.
A diferença entre trabalhar e escalar, com número. Rende série: o problema, a decisão de virar template, o resultado medido.`),
  n("n-arco3", "narrativas", "Perdi projetos e ninguém me avisou", `As 7 pastas de campanha e a Montadora Fênix sumiram do disco; o Clipradio está sem repositório. A documentação foi reconstruída pelo histórico das conversas.
Vulnerável e útil: todo dev já perdeu algo. Leva ao segundo cérebro.`),
  n("n-arco4", "narrativas", "O sistema que eu construí e esqueci", `BJJ Control: alunos, faixa, QR code, mensalidade, turmas e estoque. 1 aluno e 0 presenças.
Acumular produto sem lançar: a doença mais comum de quem sabe construir.`),
  n("n-arco5", "narrativas", "O mesmo problema em empresas diferentes", `MSL Planner e Villa's Flow resolvem fluxo de demanda com aprovação e papéis. O post que me reposiciona: resolvo fluxo de aprovação em empresa.`),
  n("n-arco6", "narrativas", "A disciplina que atravessa", `Jiu-jitsu como base; surf, corrida, academia e futebol na órbita. Site da Gigueto e o BJJ Control.
Jiu-jitsu: posição antes de submissão. Surf: o mar não negocia com a agenda. Corrida: ritmo em projeto longo. Academia: manutenção sem glamour. Futebol: ler o jogo com o outro.`),
  n("n-arco7", "narrativas", "O site do lugar que eu amo", `TS Kite Center, no Cumbuco: mais de 2.000 alunos certificados e nenhum site no ar. Em um dia o site tinha o vento ao vivo, a previsão, a loja e o mapa.
Gravar na praia, com o rosto. Nada com o nome da TS antes da aprovação deles.`),
  n("n-ref-pov", "referencias", "POV da @jup.pires", `Pessoa parada num fundo bonito enquanto cada corte empilha uma entrega real na tela. Base do Reel "site por fora, sistema por dentro".
https://www.instagram.com/p/DfVewyPsIf-/`),
  n("n-ref-guia", "referencias", "Guia de conteúdo documentativo (Nicolas Nunes)", `onicolasnunes.com/guia
Tese: quem é bom precisa mostrar o trabalho, não dizer que é bom. Conteúdo como prova pública.
A página termina vendendo mentoria; o método está resumido na nota "O caminho de uma peça".`),
  n("n-ref-avora", "referencias", "Funil de guia gratuito (Avora AI)", `Guia gratuito como isca, conversa depois. Detalhes em referencias/2026-11-08 Funil de guia gratuito da Avora AI.md no vault.`),
  n("n-numeros", "aprendizados", "O que os números mostram (14/11)", `Conta, 30 dias: 14.557 visualizações, 1.890 contas, 433 interações, 467 visitas ao perfil, 19 toques no link, 1.574 seguidores.
- Reel com o rosto é o único formato que sai da base: 61% a 79% de não seguidores. Carrossel fica em 10% a 12%.
- O único post que trouxe seguidor foi um Reel (24/05, 11 seguidores).
- Carrossel retém bem por slide, mas quase ninguém salva.
- Stories fazem metade das interações da conta.`, true),
  n("n-metas", "aprendizados", "Metas dos próximos 30 dias", `- Não seguidores no alcance: de 18% para 35%
- 10 ou mais salvamentos e envios por post
- Toques no link: de 19 para 40
- Métrica que importa: conversa iniciada no Direct e salvamento. Alcance é consequência.`),
  n("n-medicao-set", "aprendizados", "O que a medição de setembro derrubou", `Carrossel técnico ("5 bugs de infraestrutura") foi o pior post: 20 curtidas contra 267 do melhor.
Reel com rosto engaja de 2 a 4 vezes mais, em qualquer tema.
Mostrar trabalho pronto converte: a Car Store chegou por um story que só mostrava um site funcionando.`),
];

export function semente(): Estudio {
  return {
    versao: 1,
    tematicas: TEMATICAS.map((t) => ({ ...t })),
    pecas: {
      ideias: IDEIAS.map((b) => p("ideias", b)),
      roteiro: ROTEIRO.map((b) => p("roteiro", b)),
      producao: [],
      pronto: PRONTO.map((b) => p("pronto", b)),
      publicado: PUBLICADO.map((b) => p("publicado", b)),
    },
    notas: NOTAS.map((x) => ({ ...x })),
  };
}
