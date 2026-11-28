import { describe, expect, it } from "vitest";
import {
  calibracaoDaRegua,
  checarMensagem,
  concordancia,
  contarFrases,
  leadRespondeu,
} from "../../shared/radar/eval.ts";
import { leadTeste, envioTeste } from "./apoio-envio.ts";
import type { Lead, Envio } from "../../shared/radar/tipos.ts";
import type { Registro } from "../../shared/radar/funil.ts";
import type { Reprovacao } from "../../shared/radar/aprendizado.ts";

describe("eval: checarMensagem", () => {
  const leadBase = leadTeste("clinica_exemplo", 80);

  it("aprova mensagem perfeita dentro do contrato", () => {
    // 3 frases, < 280 caracteres, sem travessão, sem preço, sem link, sem reunião/call,
    // oferece prévia, termina com ?, cita fato das evidências ("celular", "site")
    const msg =
      "Olá! Vi que o site da clínica ainda não abre bem no celular. Montei uma prévia de como ficaria uma versão mais rápida, posso te mandar por aqui?";

    expect(contarFrases(msg)).toBe(3);
    const resultado = checarMensagem(msg, leadBase);
    expect(resultado.ok).toBe(true);
    expect(resultado.falhas).toHaveLength(0);
  });

  it("reprova mensagem com 4 frases", () => {
    const msg =
      "Olá! Vi que o site tem problemas no celular. Montei uma prévia nova. Posso te enviar por aqui? Fico no aguardo.";
    const resultado = checarMensagem(msg, leadBase);
    expect(resultado.ok).toBe(false);
    expect(resultado.falhas.some(f => f.includes("3 frases"))).toBe(true);
  });

  it("reprova mensagem com 2 frases", () => {
    const msg =
      "Vi que o site não funciona no celular. Posso te enviar uma prévia?";
    const resultado = checarMensagem(msg, leadBase);
    expect(resultado.ok).toBe(false);
    expect(resultado.falhas.some(f => f.includes("3 frases"))).toBe(true);
  });

  it("reprova mensagem com travessão em-dash", () => {
    const msg =
      "Olá! Vi o site no celular — notei vários problemas. Fiz uma prévia com ajustes, posso te mostrar?";
    const resultado = checarMensagem(msg, leadBase);
    expect(resultado.ok).toBe(false);
    expect(resultado.falhas.some(f => f.includes("travessão"))).toBe(true);
  });

  it("reprova menção a preço (R$, reais, número com mil)", () => {
    const msgComCifrao =
      "Olá! Vi o site no celular e cobramos R$ 500 para ajustar. Fiz uma prévia, posso te enviar?";
    expect(checarMensagem(msgComCifrao, leadBase).falhas.some(f => f.includes("preço"))).toBe(true);

    const msgComReais =
      "Olá! Vi o site no celular e cobramos 500 reais para arrumar. Fiz uma prévia, posso te enviar?";
    expect(checarMensagem(msgComReais, leadBase).falhas.some(f => f.includes("preço"))).toBe(true);

    const msgComMil =
      "Olá! Vi o site no celular e cobramos 2 mil pelo projeto. Fiz uma prévia, posso te enviar?";
    expect(checarMensagem(msgComMil, leadBase).falhas.some(f => f.includes("preço"))).toBe(true);
  });

  it("reprova menção a links", () => {
    const msgComHttp =
      "Olá! Vi o site no celular em https://clinica.example. Fiz uma prévia, posso te enviar?";
    expect(checarMensagem(msgComHttp, leadBase).falhas.some(f => f.includes("link"))).toBe(true);

    const msgComWame =
      "Olá! Vi o site no celular e o link wa.me/5585999999999 na bio. Fiz uma prévia, posso te enviar?";
    expect(checarMensagem(msgComWame, leadBase).falhas.some(f => f.includes("link"))).toBe(true);
  });

  it("reprova pedido de reunião ou call", () => {
    const msgComReuniao =
      "Olá! Vi o site no celular e montei uma prévia. Podemos agendar uma reunião esta semana?";
    expect(checarMensagem(msgComReuniao, leadBase).falhas.some(f => f.includes("reunião"))).toBe(true);

    const msgComCall =
      "Olá! Vi o site no celular e montei uma prévia. Topa uma call rápida de 10 minutos?";
    expect(checarMensagem(msgComCall, leadBase).falhas.some(f => f.includes("call"))).toBe(true);
  });

  it("reprova mensagem que não oferece prévia", () => {
    const msgSemPrevia =
      "Olá! Vi que o site da clínica tem falhas no celular. Posso te apresentar nossos serviços?";
    const resultado = checarMensagem(msgSemPrevia, leadBase);
    expect(resultado.ok).toBe(false);
    expect(resultado.falhas.some(f => f.includes("prévia"))).toBe(true);
  });

  it("reprova mensagem sem pergunta no fim (não pede permissão)", () => {
    const msgSemPergunta =
      "Olá! Vi que o site da clínica tem falhas no celular. Preparei uma prévia exclusiva para te mostrar hoje.";
    const resultado = checarMensagem(msgSemPergunta, leadBase);
    expect(resultado.ok).toBe(false);
    expect(resultado.falhas.some(f => f.includes("permissão"))).toBe(true);
  });

  it("reprova mensagem com mais de 280 caracteres", () => {
    const msgLonga =
      "Olá! " +
      "Vi que o site da clínica tem vários problemas graves de navegação e visual quando acessado por dispositivos celulares modernos, dificultando bastante o agendamento de consultas por pacientes potenciais. " +
      "Preparei uma prévia detalhada com novo layout responsivo, posso te mandar por aqui?";
    expect(msgLonga.length).toBeGreaterThan(280);
    const resultado = checarMensagem(msgLonga, leadBase);
    expect(resultado.ok).toBe(false);
    expect(resultado.falhas.some(f => f.includes("280 caracteres"))).toBe(true);
  });

  it("reprova mensagem genérica sem palavras das evidências do lead", () => {
    const msgGenerica =
      "Olá! Somos uma equipe especializada em marcas inovadoras e produtos digitais. Montei uma prévia demonstrativa, posso te mandar por aqui?";
    const resultado = checarMensagem(msgGenerica, leadBase);
    expect(resultado.ok).toBe(false);
    expect(resultado.falhas.some(f => f.includes("evidências do lead"))).toBe(true);
  });
});

describe("eval: calibracaoDaRegua", () => {
  it("calcula calibração por faixa e lift por critério com dados sintéticos", () => {
    const leads: Lead[] = [];
    const envios: Envio[] = [];
    const funil: Record<string, Registro> = {};
    const reprovados: Reprovacao[] = [];

    // Cria 12 leads quentes (nota 80)
    for (let i = 1; i <= 12; i++) {
      const id = `quente_${i}`;
      const l = leadTeste(id, 80);
      leads.push(l);

      if (i <= 6) {
        // 6 aprovados com envio
        envios.push(envioTeste({ id: `${id}:primeira`, leadId: id, status: "enviado" }));
        if (i <= 3) {
          // 3 responderam
          funil[id] = { etapa: "respondeu", anotacao: "Respondeu bem", atualizadoEm: "2026-11-01" };
        } else {
          funil[id] = { etapa: "abordado", anotacao: "Enviado", atualizadoEm: "2026-11-01" };
        }
      } else if (i <= 8) {
        // 2 reprovados no painel
        reprovados.push({
          id,
          nome: l.nome,
          segmento: l.segmento,
          cidade: l.cidade,
          uf: l.uf,
          motivo: "Site já é bom",
          em: "2026-11-01",
        });
        funil[id] = { etapa: "descartado", anotacao: "Reprovado: Site já é bom", atualizadoEm: "2026-11-01" };
      }
    }

    // Cria 5 leads frios (nota 30)
    for (let i = 1; i <= 5; i++) {
      const id = `frio_${i}`;
      const l = leadTeste(id, 30);
      l.criterios.presenca_web.ok = false; // critério ausente
      leads.push(l);

      // 4 frios reprovados
      if (i <= 4) {
        reprovados.push({
          id,
          nome: l.nome,
          segmento: l.segmento,
          cidade: l.cidade,
          uf: l.uf,
          motivo: "Sem perfil",
          em: "2026-11-01",
        });
        funil[id] = { etapa: "descartado", anotacao: "Reprovado: Sem perfil", atualizadoEm: "2026-11-01" };
      }
    }

    const resultado = calibracaoDaRegua(leads, envios, funil, reprovados);

    // Faixa quente
    expect(resultado.faixas.quente.total).toBe(12);
    expect(resultado.faixas.quente.amostraPequena).toBe(false);
    expect(resultado.faixas.quente.comMensagemAprovada).toBe(6);
    expect(resultado.faixas.quente.taxaMensagemAprovada).toBe(0.5);
    expect(resultado.faixas.quente.reprovados).toBe(2);
    expect(resultado.faixas.quente.enviados).toBe(6);
    expect(resultado.faixas.quente.responderam).toBe(3);
    expect(resultado.faixas.quente.taxaResposta).toBe(0.5);

    // Faixa fria
    expect(resultado.faixas.frio.total).toBe(5);
    expect(resultado.faixas.frio.amostraPequena).toBe(true); // n < 10
    expect(resultado.faixas.frio.reprovados).toBe(4);
    expect(resultado.faixas.frio.taxaReprovados).toBe(0.8);

    // Critério presenca_web: presente nos quentes aprovados, ausente nos frios reprovados
    const critPresenca = resultado.criterios.find(c => c.id === "presenca_web");
    expect(critPresenca).toBeDefined();
    expect(critPresenca?.presenteAprovados).toBe(6);
    expect(critPresenca?.totalAprovados).toBe(6);
    expect(critPresenca?.taxaAprovados).toBe(1);
    expect(critPresenca?.totalReprovados).toBe(6); // 2 quentes + 4 frios
    expect(critPresenca?.presenteReprovados).toBe(2); // só os 2 quentes têm
    // lift = 1.0 / (2/6) = 3.0
    expect(critPresenca?.lift).toBe(3);
  });

  it("detecta resposta também pelo histórico de etapas no funil", () => {
    const lead = leadTeste("lead_historico", 80);
    const registroComHistorico: Registro = {
      etapa: "descartado",
      anotacao: "Desistiu depois da reunião",
      atualizadoEm: "2026-11-10",
      historico: [
        { etapa: "abordado", em: "2026-11-01" },
        { etapa: "respondeu", em: "2026-11-03" },
        { etapa: "descartado", em: "2026-11-10" },
      ],
    };
    expect(leadRespondeu(registroComHistorico)).toBe(true);

    const registroSemResposta: Registro = {
      etapa: "descartado",
      anotacao: "Não respondeu",
      atualizadoEm: "2026-11-10",
      historico: [{ etapa: "abordado", em: "2026-11-01" }],
    };
    expect(leadRespondeu(registroSemResposta)).toBe(false);
  });
});

describe("eval: concordancia (Kappa de Cohen)", () => {
  it("calcula acurácia, matriz e kappa conhecido exatamente", () => {
    // Exemplo clássico de livro:
    // 100 casos
    // Humano: 60 true (45 VP + 15 FN), 40 false (5 FP + 35 VN)
    // Juiz:   50 true (45 VP + 5 FP), 50 false (15 FN + 35 VN)
    // Po = (45 + 35)/100 = 0.80
    // Pe = (0.60 * 0.50) + (0.40 * 0.50) = 0.30 + 0.20 = 0.50
    // Kappa = (0.80 - 0.50) / (1 - 0.50) = 0.30 / 0.50 = 0.60
    const humanos: boolean[] = [
      ...Array(45).fill(true),  // VP
      ...Array(15).fill(true),  // FN
      ...Array(5).fill(false),  // FP
      ...Array(35).fill(false), // VN
    ];
    const juiz: boolean[] = [
      ...Array(45).fill(true),  // VP
      ...Array(15).fill(false), // FN
      ...Array(5).fill(true),   // FP
      ...Array(35).fill(false), // VN
    ];

    const res = concordancia(humanos, juiz);
    expect(res.n).toBe(100);
    expect(res.matriz).toEqual({ vp: 45, fn: 15, fp: 5, vn: 35 });
    expect(res.acuracia).toBe(0.8);
    expect(res.po).toBe(0.8);
    expect(res.pe).toBe(0.5);
    expect(res.kappa).toBe(0.6);
  });

  it("trata concordância perfeita com kappa = 1", () => {
    const h = [true, true, false, false, true];
    const j = [true, true, false, false, true];
    const res = concordancia(h, j);
    expect(res.acuracia).toBe(1);
    expect(res.kappa).toBe(1);
  });

  it("trata caso vazio sem estourar divisão por zero", () => {
    const res = concordancia([], []);
    expect(res.n).toBe(0);
    expect(res.acuracia).toBe(0);
    expect(res.kappa).toBe(0);
  });
});

describe("eval: mensagens no formato aprovado pelo Matheus", () => {
  it("aceita saudação + 3 frases e domínio do lead citado como prova", () => {
    const msg =
      "Oi, pessoal do Le Jardin! Que cenário lindo o casamento debaixo do cajueiro centenário. Reparei que o site lejardin.com.br da ficha no Google mostra uma página de domínio à venda. Sou o Matheus, da MF Services: posso mandar uma prévia de como ficaria o site de vocês?";
    const r = checarMensagem(msg, leadTeste());
    expect(r.falhas.filter(f => f.includes("frases") || f.includes("links"))).toEqual([]);
  });
});
