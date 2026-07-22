# MF Services — Portfólio

Portfólio profissional de **Matheus Frota**, desenvolvedor fullstack. O projeto apresenta soluções digitais, estudos de caso, habilidades técnicas, serviços e artigos sobre desenvolvimento de software em uma experiência moderna, responsiva e com suporte a tema claro e escuro.

<p align="center">
  <img src="client/public/logo-topbar.png" alt="Logo MF Services" width="220" />
</p>

## Sobre o projeto

Este site foi desenvolvido para reunir projetos reais e demonstrar experiência na criação de landing pages, aplicações web, dashboards, automações e plataformas completas. Além da apresentação profissional, o portfólio oferece canais diretos para contato e solicitação de orçamento.

### Principais recursos

- Portfólio de projetos organizado por categoria;
- **MF Diagnóstico IA** — mini-produto SaaS de diagnóstico digital para PMEs (rota `/diagnostico`);
- páginas individuais com estudos de caso;
- seção de habilidades, tecnologias e serviços;
- blog com artigos e rotas próprias;
- navegação responsiva para desktop e dispositivos móveis;
- alternância entre tema claro e escuro;
- animações, carrosséis e elementos visuais interativos;
- contato direto e solicitação de orçamento pelo WhatsApp;
- servidor Express preparado para servir a aplicação em produção.

## MF Diagnóstico IA

Ferramenta de diagnóstico digital apresentada em uma **seção exclusiva da home**, cujo botão leva à rota `/diagnostico` (de propósito, fora do menu — acesso só pelo destaque). O visitante preenche um briefing (empresa, segmento, site, Instagram e objetivo) e recebe um relatório completo em três etapas:

1. **Briefing** — landing com formulário e demonstração pré-configurada de uma loja de veículos;
2. **Processamento** — etapas de análise progressivas com animações;
3. **Relatório** — nota geral, pontuação em 5 pilares (posicionamento, presença digital, conversão, autoridade e automação), problemas, oportunidades, recomendações prioritárias, nova proposta de valor, headline sugerida, ideias de conteúdo, automações recomendadas, plano de ação de 7 dias e bloco de conversão via WhatsApp.

### Arquitetura preparada para IA

O diagnóstico atual usa **regras locais determinísticas** (`client/src/features/diagnostico/engine.ts`): as notas derivam dos campos preenchidos + hash estável do nome/segmento, e o conteúdo vem de bibliotecas por segmento (veículos, alimentação, moda, saúde, serviços e genérico).

A UI depende apenas do contrato `DiagnosticoProvider` (`types.ts`). Para plugar uma API de inteligência artificial de verdade, basta trocar o provider:

```ts
// hoje
<Processing provider={localRulesProvider} ... />

// amanhã: endpoint que recebe o DiagnosticoInput e devolve um DiagnosticoReport
<Processing provider={createApiProvider("/api/diagnostico")} ... />
```

Os testes do motor ficam em `client/src/features/diagnostico/engine.test.ts` (`pnpm test`).

## Tecnologias

### Frontend

- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Wouter](https://github.com/molefrog/wouter)
- [Lucide React](https://lucide.dev/)
- Radix UI

### Backend e ferramentas

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [esbuild](https://esbuild.github.io/)
- [pnpm](https://pnpm.io/)
- Prettier e TypeScript para padronização e validação do código

## Como executar localmente

### Pré-requisitos

- Node.js 20 ou superior;
- pnpm 10 ou superior.

```bash
# Clone o repositório
git clone https://github.com/mhrzfrota/portfolio-mf.git

# Entre na pasta do projeto
cd portfolio-mf

# Instale as dependências
pnpm install

# Inicie o ambiente de desenvolvimento
pnpm dev
```

A aplicação ficará disponível em `http://localhost:3000` ou na próxima porta livre indicada pelo Vite.

## Scripts disponíveis

| Comando        | Descrição                                           |
| -------------- | --------------------------------------------------- |
| `pnpm dev`     | Inicia o servidor de desenvolvimento do Vite        |
| `pnpm build`   | Gera o frontend e empacota o servidor para produção |
| `pnpm start`   | Inicia a aplicação compilada em modo de produção    |
| `pnpm preview` | Visualiza localmente o build do Vite                |
| `pnpm check`   | Verifica os tipos com o TypeScript                  |
| `pnpm test`    | Roda os testes (Vitest) do motor de diagnóstico     |
| `pnpm format`  | Formata o código com o Prettier                     |

## Estrutura do projeto

```text
portfolio-mf/
├── client/
│   ├── public/             # Imagens, vídeos, logos e currículo
│   └── src/
│       ├── components/     # Componentes reutilizáveis da interface
│       ├── contexts/       # Contextos de tema e idioma
│       ├── data/           # Conteúdo dos projetos e artigos
│       ├── features/
│       │   └── diagnostico/  # MF Diagnóstico IA (motor, tipos, demo, telas)
│       ├── i18n/           # Textos da interface em PT/EN
│       ├── pages/          # Páginas e detalhes do portfólio
│       └── App.tsx         # Rotas principais da aplicação
├── server/
│   └── index.ts            # Servidor Express para produção
├── shared/                 # Constantes compartilhadas
├── package.json
└── vite.config.ts
```

## Build de produção

```bash
pnpm build
pnpm start
```

O frontend é gerado em `dist/public` e servido pelo Express. A porta pode ser configurada pela variável de ambiente `PORT`; por padrão, o servidor utiliza a porta `3000`.

> **Windows:** o script `start` define `NODE_ENV` com sintaxe Unix. No PowerShell, rode:
> `$env:NODE_ENV = "production"; node dist/index.js`

## Deploy

O build produz dois artefatos: o site estático em `dist/public` e o servidor Express em `dist/index.js` (que serve os estáticos e faz o fallback de rotas do SPA — necessário para rotas diretas como `/diagnostico`).

### Opção 1 — Plataforma Node (Render, Railway, Fly.io, VPS)

1. Build: `pnpm install && pnpm build`
2. Start: `NODE_ENV=production node dist/index.js`
3. Defina `PORT` se a plataforma exigir (o servidor lê `process.env.PORT`).

### Opção 2 — Hospedagem estática (Vercel, Netlify, Cloudflare Pages)

1. Comando de build: `pnpm build` (ou apenas `vite build`)
2. Diretório de saída: `dist/public`
3. Configure o fallback de SPA (rewrite de todas as rotas para `/index.html`), senão rotas diretas como `/diagnostico` retornam 404.

## Contato

**Matheus Frota — Desenvolvedor Fullstack**

- [GitHub](https://github.com/mhrzfrota)
- [LinkedIn](https://www.linkedin.com/in/matheusfrt)
- [Instagram](https://www.instagram.com/emefeservices)
- [WhatsApp](https://wa.me/5585996370080)

---

Desenvolvido por [Matheus Frota](https://github.com/mhrzfrota).
