# Finanças do portfólio

A aba usa a sessão do portfólio e o mesmo Supabase do sistema interno. O usuário autenticado acessa seus próprios dados por RLS. As compras da Carteira usam um token por aparelho e entram no cofre associado a ele.

## Dados e contratos

| Tabela | Conteúdo |
| --- | --- |
| `frtcash_cards` | Lançamentos pessoais e de trabalho. Guarda o FITID do extrato e a origem `manual`, `ofx`, `apple_pay` ou `recurring`. |
| `frtcash_investment_goals` | Meta de investimento por usuário e mês. |
| `frtcash_category_rules` | Categoria aprendida por usuário e palavra-chave. |
| `frtcash_capture_tokens` | Aparelho, cofre, hash SHA-256, prefixo de exibição, último uso e revogação. |
| `frtcash_capture_log` | Janela de uso por token. A tabela é privada para a função de captura. |
| `frtcash_category_budgets` | Teto mensal por usuário, cofre e categoria. |
| `frtcash_recurring` | Moldes de entrada ou saída e a última ocorrência gerada, em `generated_until`. |
| `frtcash_couple_plans` | Um plano da Meta a Dois em JSON por usuário, com data de atualização. |

As funções de dados recebem o cliente autenticado do portfólio. `updateCardCategory` atualiza apenas a categoria da despesa. `loadCouplePlan(client, userId)` devolve o plano ou `null`. `saveCouplePlan(client, userId, plan)` salva o objeto com `goal`, `saved`, `monthly`, `startMonth` e `deadline`. [Camada de dados](../client/src/features/financas/dados.ts) · [Formato do plano](../shared/financas/coupleGoal.ts)

`frtcash_materialize_recurring` gera os meses elegíveis de um molde ativo até a data pedida, respeitando a vigência e o fim do mês corrente em Fortaleza. O dia 31 passa para o último dia dos meses mais curtos. O índice único impede repetir a mesma parcela. `generated_until` preserva a exclusão de uma parcela pelo usuário. [Schema e funções](../supabase/migrations/0010_financas.sql)

## Captura pelo iPhone

Crie o token com `createCaptureToken(client, label, vault)`, que chama `frtcash_create_capture_token`. O cofre padrão é `personal`. O segredo tem o prefixo `frt_` e 48 dígitos hexadecimais. Copie-o na criação. Depois, a lista mostra apenas os oito caracteres de identificação. Cada usuário pode ter cinco aparelhos ativos.

No Atalhos, use o gatilho **Transação** da Carteira. Na ação **Obter Conteúdo de URL**, escolha POST, corpo JSON e o cabeçalho `Authorization: Bearer <token>`. Passe o campo `message` da resposta à ação **Mostrar Notificação**. No exemplo, `PORTFOLIO_URL` é a origem HTTPS do portfólio e `TOKEN_DO_APARELHO` é o token da automação.

```sh
curl --request POST "$PORTFOLIO_URL/api/financas/captura" \
  --header "Authorization: Bearer $TOKEN_DO_APARELHO" \
  --header 'Content-Type: application/json' \
  --data '{"valor":"R$ 12,50","estabelecimento":"iFood","cartao":"Pessoal","occurred_at":"2026-11-27T01:15:00Z"}'
```

| Campo JSON | Formato |
| --- | --- |
| `valor` ou `amount` | Obrigatório. Número ou texto monetário, até duas casas. O valor absoluto deve estar entre R$ 0,01 e R$ 100.000,00. Aceita `"R$ 1.234,56"` e `"1234.56"`. |
| `estabelecimento` ou `merchant` | Obrigatório. A rota apara, reúne espaços consecutivos e conserva até 120 caracteres. |
| `cartao` ou `card` | Nome de exibição opcional. |
| `occurred_at` | Data ou instante ISO opcional. Sem fuso explícito, a rota usa `-03:00`. Se ausente, vale a hora da captura. |

O corpo aceita até 4.096 bytes de JSON UTF-8. O lançamento usa a data civil de Fortaleza. No exemplo, a compra pertence a 26 de novembro. O cofre vem do token. A função da Vercel chama `frtcash_capture_payment` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. A alternativa para projetos com a chave antiga é `VITE_SUPABASE_ANON_KEY`.

```json
{
  "ok": true,
  "message": "R$ 12,50 · iFood · Alimentação",
  "entry": {
    "id": "ap-704b828f-e6cc-4865-a759-45449458ba11",
    "title": "iFood",
    "amount": 12.5,
    "category": "Alimentação",
    "vault": "personal",
    "occurred_at": "2026-11-26",
    "duplicate": false
  }
}
```

A categoria vem da última despesa do usuário no estabelecimento. Depois valem a regra pessoal com a palavra-chave mais longa, a sugestão padrão válida e, por fim, `Outros`. A chave do estabelecimento ignora caixa, acentos, pontuação e números soltos.

Duas capturas do mesmo usuário, estabelecimento e valor em até três minutos devolvem o lançamento original, inclusive entre aparelhos ou cofres. A repetição retorna 200, `duplicate: true` e a mensagem `Já registrado: R$ 12,50 · iFood · Alimentação`. Ela conta no limite de 30 capturas por hora do aparelho. Todas as respostas usam `Cache-Control: no-store`.

| HTTP | Significado |
| --- | --- |
| 200 | Compra registrada ou duplicata reconhecida. |
| 401 | Token ausente, inválido ou revogado. |
| 405 | Método diferente de POST. |
| 413 | Corpo acima de 4.096 bytes. |
| 422 | JSON ou campos inválidos. |
| 429 | Limite do token na última hora atingido. |
| 500 | A API não conseguiu confirmar a compra. |

Os erros têm o formato `{"ok":false,"message":"Token inválido ou revogado."}`. [Implementação da rota](../server/financas/captura.ts) · [Validação e mensagens](../shared/financas/captura.ts)

## Ativar

1. **Migration.** No SQL Editor do Supabase do portfólio, aplique [0010_financas.sql](../supabase/migrations/0010_financas.sql). Ela só cria objetos `frtcash_*` e pode rodar de novo sem erro. (Aplicada pelo Matheus em 2026-11-27.)
2. **Deploy.** A aba aparece em `/financas` para o dono; o parceiro do Radar não vê.
3. **iPhone.** Em Finanças > Ajustes > Conectar o iPhone, gere a chave e siga os passos do Atalhos. A rota é `/api/financas/captura`.

Os dados do FRTCASH **não** foram importados (decisão do Matheus em 2026-11-27): a aba começou vazia. O script de cópia que chegou a ser escrito foi retirado.
