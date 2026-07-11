# MF Services — Portfólio

Portfólio profissional de **Matheus Frota**, desenvolvedor fullstack. O projeto apresenta soluções digitais, estudos de caso, habilidades técnicas, serviços e artigos sobre desenvolvimento de software em uma experiência moderna, responsiva e com suporte a tema claro e escuro.

<p align="center">
  <img src="client/public/logo-topbar.png" alt="Logo MF Services" width="220" />
</p>

## Sobre o projeto

Este site foi desenvolvido para reunir projetos reais e demonstrar experiência na criação de landing pages, aplicações web, dashboards, automações e plataformas completas. Além da apresentação profissional, o portfólio oferece canais diretos para contato e solicitação de orçamento.

### Principais recursos

- Portfólio de projetos organizado por categoria;
- páginas individuais com estudos de caso;
- seção de habilidades, tecnologias e serviços;
- blog com artigos e rotas próprias;
- navegação responsiva para desktop e dispositivos móveis;
- alternância entre tema claro e escuro;
- animações, carrosséis e elementos visuais interativos;
- contato direto e solicitação de orçamento pelo WhatsApp;
- servidor Express preparado para servir a aplicação em produção.

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

| Comando | Descrição |
| --- | --- |
| `pnpm dev` | Inicia o servidor de desenvolvimento do Vite |
| `pnpm build` | Gera o frontend e empacota o servidor para produção |
| `pnpm start` | Inicia a aplicação compilada em modo de produção |
| `pnpm preview` | Visualiza localmente o build do Vite |
| `pnpm check` | Verifica os tipos com o TypeScript |
| `pnpm format` | Formata o código com o Prettier |

## Estrutura do projeto

```text
portfolio-mf/
├── client/
│   ├── public/             # Imagens, vídeos, logos e currículo
│   └── src/
│       ├── components/     # Componentes reutilizáveis da interface
│       ├── contexts/       # Contexto de tema
│       ├── data/           # Conteúdo dos projetos e artigos
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

## Contato

**Matheus Frota — Desenvolvedor Fullstack**

- [GitHub](https://github.com/mhrzfrota)
- [LinkedIn](https://www.linkedin.com/in/matheusfrt)
- [Instagram](https://www.instagram.com/emefeservices)
- [WhatsApp](https://wa.me/5585996370080)

---

Desenvolvido por [Matheus Frota](https://github.com/mhrzfrota).
