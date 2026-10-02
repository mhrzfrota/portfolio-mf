import { criarCartao, quadroVazio, type Cartao, type ColunaId, type EtiquetaId, type Quadro } from "./quadro";

/**
 * Primeira abertura do quadro: o que estava no vault (FRT CEREBRO) em
 * 2026-10-02. Foco da semana, pendências dos projetos, banco de ideias,
 * workflow comercial e as referências visuais já usadas.
 */
type Semente = {
  titulo: string;
  etiquetas?: EtiquetaId[];
  projeto?: string;
  descricao?: string;
  link?: string;
  data?: string;
  hora?: string;
  checklist?: string[];
};

const COLUNAS_SEMENTE: Record<ColunaId, Semente[]> = {
  ideias: [
    {
      titulo: "Bot de IA para os leads do tráfego pago da Lopes",
      etiquetas: ["sistema", "automacao", "cliente"],
      projeto: "Lopes Veículos",
      descricao: "Responder na hora o que o lead mais pergunta: valor e informações do veículo, usando o estoque do Sistema LV.",
      checklist: ["Por onde os leads chegam (WhatsApp, Direct, formulário)?", "Responde sozinho ou sugere a resposta ao vendedor?", "O que ele nunca pode responder sozinho", "Como passa para um vendedor humano"],
    },
    {
      titulo: "MCP no Claude para subir anúncios no Gerenciador",
      etiquetas: ["automacao", "estudo"],
      descricao: "Testar antes de construir. Conta de teste, anúncio pausado por padrão e nada publicado sem aprovação.",
      checklist: ["Existe MCP pronto para a Marketing API?", "Testar numa conta de anúncios de teste", "Definir a confirmação antes de qualquer gasto"],
    },
    {
      titulo: "Sistema de concessionária como produto, com mensalidade",
      etiquetas: ["produto", "sistema"],
      projeto: "Sistema LV",
      descricao: "Seis contas no mesmo setor é vertical. A integração com a OLX (anúncio, chat, FIPE, placa) é o diferencial que ninguém da região tem.",
    },
    {
      titulo: "Trocar manutenção por chamado por plano mensal",
      etiquetas: ["cliente"],
      projeto: "Car Store",
      descricao: "O R$ 150 por chamado só paga quando algo quebra. Plano mensal vira receita previsível. Aplicar na próxima renovação.",
    },
    {
      titulo: "Rotina de segunda no Maestri: lista de 10 negócios do nicho",
      etiquetas: ["automacao"],
      descricao: "Agendar o /last30days do nicho da semana para a lista de prospecção chegar pronta toda segunda.",
    },
    {
      titulo: "Série \"tatame e tela\": um princípio de jiu-jitsu por semana",
      etiquetas: ["conteudo"],
      descricao: "Sempre um detalhe concreto do treino antes do paralelo com o trabalho.",
    },
    {
      titulo: "Post: \"Quanto custa um site? Por que ninguém te responde\"",
      etiquetas: ["conteudo"],
      descricao: "Post de objeção, alto salvamento. Base: a tabela de preços em financas/.",
    },
    {
      titulo: "Série \"o erro da semana\"",
      etiquetas: ["conteudo"],
      descricao: "Algo que quebrou e o porquê. Os aprendizados técnicos do vault já dão dezenas de episódios.",
    },
    {
      titulo: "Reel: o site do lugar que eu amo (TS Kite Center)",
      etiquetas: ["conteudo"],
      projeto: "TS Kite Center",
      descricao: "Antes e depois gravado na praia, com o rosto. Só publicar depois da aprovação da escola. Ver narrativas, arco 7.",
    },
    {
      titulo: "Barbershop: dados reais e Supabase",
      etiquetas: ["sistema"],
      projeto: "Barbershop",
      descricao: "Em standby desde 28/09. Protótipo local pronto (landing, agendamento, painel do barbeiro).",
    },
    {
      titulo: "Patrício Lima: ler o perfil e preencher o portfólio",
      etiquetas: ["cliente"],
      projeto: "Patrício Lima",
      descricao: "Em standby desde 28/09. Estrutura no estilo Lozy pronta, falta o conteúdo do Instagram.",
    },
  ],
  referencias: [
    { titulo: "Aeline: minimalismo arredondado", etiquetas: ["estudo"], link: "https://aeline.webflow.io/home/home-v3", descricao: "Base do visual da TS: cards em bandeja, botões em pílula, um único acento." },
    { titulo: "Lozy Creative: portfólio de filmmaker", etiquetas: ["estudo"], link: "https://lozycreative.com/", descricao: "Hero dividido, verbete de dicionário, sanfona de vídeos. Base do Patrício Lima." },
    { titulo: "Ousmane Ballon d'Or: animação de scroll com peso", etiquetas: ["estudo"], link: "https://ousmaneballondor.fr/" },
    { titulo: "Axion Studio", etiquetas: ["estudo"], descricao: "Referência de design premium citada na identidade da MF Services." },
    { titulo: "Telas internas estilo documentação da OpenAI", etiquetas: ["estudo"], descricao: "Referência para sistemas internos e painéis." },
  ],
  fazer: [
    {
      titulo: "TS: pedir material à escola",
      etiquetas: ["cliente", "urgente"],
      projeto: "TS Kite Center",
      checklist: ["Fotos e vídeo em alta", "Produtos reais da loja", "Confirmar a logo (\"KITE SHOP\" ou escola?)", "Autorização para os depoimentos"],
    },
    { titulo: "TS: versão em inglês", etiquetas: ["sistema"], projeto: "TS Kite Center" },
    { titulo: "TS: combinar os detalhes da permuta", etiquetas: ["cliente"], projeto: "TS Kite Center", checklist: ["Quantas aulas", "Prazo para usar", "Manutenção entra ou é cobrada à parte"] },
    { titulo: "TS: ligar a loja ao Supabase", etiquetas: ["sistema"], projeto: "TS Kite Center", descricao: "Hoje o cadastro do painel fica no navegador de quem cadastrou. Trocar a implementação de RepositorioLoja." },
    {
      titulo: "Volt: ligar a loja",
      etiquetas: ["cliente", "sistema"],
      projeto: "Volt Acessórios",
      descricao: "Passo a passo em COLOCAR-NO-AR.md no repositório.",
      checklist: ["Criar o Supabase e rodar sql/01-esquema.sql", "InfiniteTag da loja", "Endereço da loja", "Logo em vetor", "Compra de teste com Pix baixo"],
    },
    {
      titulo: "Outro Beach Club: confirmar dados com o clube",
      etiquetas: ["cliente"],
      projeto: "Outro Beach Club",
      checklist: ["Qual é o WhatsApp de reservas", "Endereço certo", "Usam motor de reservas?", "Relação comercial: proposta, permuta ou case"],
    },
    { titulo: "Sistema LV: SUPABASE_SERVICE_ROLE_KEY vazia desde 06/09", etiquetas: ["sistema", "urgente"], projeto: "Sistema LV", descricao: "Cinco minutos de trabalho, travado há semanas." },
    { titulo: "Sistema LV: commitar ou reverter a integração Meta Ads", etiquetas: ["sistema", "urgente"], projeto: "Sistema LV", descricao: "285 linhas fora do Git desde 04/09." },
    { titulo: "Car Store: rodar supabase/04-marcas.sql", etiquetas: ["sistema"], projeto: "Car Store", descricao: "Sem ele o cadastro de marcas só funciona no local." },
    { titulo: "Graniq: data de merge ou declarar pausado", etiquetas: ["produto"], projeto: "Graniq", descricao: "Cinco branches abertas, nenhuma mergeada desde 30/08." },
    { titulo: "Preencher a cobrança por projeto de memória", etiquetas: ["cliente"], descricao: "1 linha preenchida de 31. Destrava a tabela de preços e a mensalidade do sistema." },
    { titulo: "Fechar a tabela de preços da MF Services", etiquetas: ["cliente"], descricao: "Rascunho com os colchetes em financas/tabela-de-precos-2026-09-29.md." },
    { titulo: "Aplicar a bio nova do Instagram", etiquetas: ["conteudo"], descricao: "Escrita em 16/09, ainda não aplicada." },
  ],
  agenda: [
    { titulo: "Medir o funil da semana (15 min)", etiquetas: ["automacao"], data: "2026-10-02", descricao: "Só três números: conversas no direct, propostas e clientes." },
    { titulo: "Atualizar o Foco da semana", etiquetas: ["pessoal"], data: "2026-10-05", descricao: "Toda segunda, no CLAUDE.md do vault." },
    { titulo: "Encher o funil: 10 negócios do nicho (30 min)", etiquetas: ["cliente"], data: "2026-10-05" },
  ],
  feito: [
    { titulo: "TS: painel da loja no ar (/admin)", etiquetas: ["sistema"], projeto: "TS Kite Center" },
    { titulo: "TS: seção de preços para leigos", etiquetas: ["sistema"], projeto: "TS Kite Center" },
    { titulo: "TS: permuta fechada por aulas de kite", etiquetas: ["cliente"], projeto: "TS Kite Center" },
    { titulo: "Volt: loja completa em modo demonstração", etiquetas: ["sistema"], projeto: "Volt Acessórios" },
    { titulo: "Outro Beach Club: primeira versão do site novo", etiquetas: ["sistema"], projeto: "Outro Beach Club" },
    { titulo: "Lyre Store no ar com pagamento", etiquetas: ["sistema"], projeto: "Lyre Store" },
  ],
};

/** Datas de conclusão reais dos itens já feitos (do histórico do vault). */
const CONCLUIDOS: Record<string, string> = {
  "TS: painel da loja no ar (/admin)": "2026-09-30",
  "TS: seção de preços para leigos": "2026-09-29",
  "TS: permuta fechada por aulas de kite": "2026-09-28",
  "Volt: loja completa em modo demonstração": "2026-09-30",
  "Outro Beach Club: primeira versão do site novo": "2026-09-29",
  "Lyre Store no ar com pagamento": "2026-09-23",
};

export function semente(hoje?: string): Quadro {
  const q = quadroVazio();
  for (const [coluna, lista] of Object.entries(COLUNAS_SEMENTE) as [ColunaId, Semente[]][]) {
    q.colunas[coluna] = lista.map((s): Cartao => {
      const c = criarCartao(
        {
          coluna,
          titulo: s.titulo,
          descricao: s.descricao ?? "",
          etiquetas: s.etiquetas ?? [],
          projeto: s.projeto ?? "",
          link: s.link ?? "",
          data: s.data ?? "",
          hora: s.hora ?? "",
          checklist: (s.checklist ?? []).map((texto, i) => ({ id: `${coluna}-${i}-${texto.length}`, texto, feito: false })),
        },
        hoje,
      );
      return coluna === "feito" ? { ...c, concluidoEm: CONCLUIDOS[s.titulo] ?? c.criadoEm } : c;
    });
  }
  return q;
}
