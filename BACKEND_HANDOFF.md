# Eskgo — contrato de integração após o fechamento do front-end

## Estado atual

Aplicação React/Vite local. Login e Cadastro são livres, sem autenticação; dados financeiros ficam no `localStorage`; a conversa fica em memória. Fatura e Assistente são demonstrações claramente identificadas. Não há OpenAI, API, chave, banco de dados ou upload remoto conectado.

## Pontos de integração

| Área                | Entrada atual                                     | Substituição futura                                               |
| ------------------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| Acesso              | `AuthScreen.onEnter`                              | Login/cadastro via servidor, sessão segura e erros por campo      |
| Dados financeiros   | `Data`, `load` e `setData` em `App.tsx`           | Repositório/API autenticada com leitura e mutações                |
| Fatura              | `InvoiceScreen` e `confirmInvoice`                | Envio autenticado, extração assíncrona e confirmação transacional |
| Assistente          | `AssistantGateway` em `src/services/assistant.ts` | Adapter HTTP para um endpoint do próprio servidor                 |
| Conversa e feedback | `useAssistant` em `src/hooks/useAssistant.ts`     | Mantém a interface; gateway retorna insight ou erro tipado        |

## Contrato do Assistente

`AssistantGateway.reply(request, signal): Promise<Insight>` recebe:

- Pergunta.
- Histórico de mensagens.
- Contexto: transações, cartões com fatura atual, metas, orçamento e saldo.
- `AbortSignal` para cancelamento.

Retorna `Insight`: `label`, `value`, `title` e `body`, todos texto simples. A UI renderiza como texto React, não como HTML. O hook já trata carregamento, sucesso, erro, timeout, cancelamento, nova tentativa e nova conversa; respostas de solicitações canceladas são ignoradas. Sair da tela não desmonta o hook, então a resposta continua disponível ao voltar. Sair da demonstração limpa e cancela a conversa.

**No backend real:** reconstruir o contexto a partir do usuário autenticado; não confiar em valores financeiros enviados pelo cliente. Validar a resposta antes de devolvê-la ao front-end. OpenAI deve ser chamada somente no servidor, com segredo no ambiente do servidor. Streaming exigirá estender o contrato com eventos/chunks; ainda não está implementado.

## Fatura e confirmação

1. Autenticar o usuário.
2. Validar arquivo no servidor (tipo real, tamanho e conteúdo), além da validação de interface.
3. Extrair os lançamentos com OpenAI no servidor.
4. Devolver um rascunho editável, sem gravar compras.
5. Confirmar somente compras selecionadas.
6. Executar a gravação e a atualização de saldo/fatura em uma transação atômica.
7. Aplicar chave de idempotência no servidor e devolver os valores recalculados.

A demonstração valida PDF/JPG/PNG/WebP até 10 MB. A revisão permite editar valor/categoria e selecionar compras. O cliente rejeita valores inválidos e não duplica IDs nem lotes já confirmados.

**Limitação atual:** arquivos próprios são identificados por metadados e cartão, não por hash do conteúdo. Uma confirmação parcial bloqueia nova confirmação do mesmo lote. Duplicatas semânticas com compras digitadas precisam ser desmarcadas pela pessoa. No backend, definir reconciliação por hash/identificador do extrato e por compra.

## Regras financeiras a preservar

- Valores com no máximo duas casas decimais; no servidor, preferir centavos inteiros.
- Cadastrar gasto reduz saldo, altera o mês correspondente e a fatura do cartão.
- Editar/apagar gasto aplica a diferença, sem descontar o mesmo valor novamente.
- Renomear cartão preserva compras e o valor de fatura registrado.
- Aporte em meta reduz saldo e aumenta o guardado, sem ser contado como consumo do mês.
- Aporte não pode superar o saldo disponível.
- Alterar teto não altera saldo nem gera transação.
- Assistente não realiza aportes ou cancela assinaturas; somente explica números.
- Respostas de planejamento consideram tanto orçamento quanto saldo disponível.

## Ajustes de modelo antes da persistência real

- Trocar o vínculo atual por apelido de cartão (`Transaction.card`) por `cardId` estável.
- Relacionar transações, cartões, metas, faturas e conversas a um proprietário autenticado.
- Separar saldo inicial, movimentos, aportes e ajustes de fatura; não migrar fórmulas de seed para produção.
- Definir datas reais de vencimento/fechamento, em vez de dias relativos do mock.
- Diferenciar fatura manual inicial e lançamentos de cartão para evitar dupla contabilização.
- Definir o comportamento de exclusão de compras importadas e reimportação posterior.
- Persistir IDs de idempotência, status de extração e confirmação no servidor.

## Estados que o backend deve alimentar

- Formulários: validação, enviando, sucesso, conflito, sessão expirada e falha recuperável.
- Fatura: selecionada, enviando, extraindo, aguardando revisão, confirmando, confirmada e erro.
- Chat: enviando, respondendo, concluído, erro/timeout e cancelado.
- Dados: carregando, vazio, erro com nova tentativa e conteúdo atualizado.

O envio/extração real, erros de rede, autorização, concorrência de mutações e segurança devem ser validados novamente quando os endpoints existirem. A validação atual cobre o comportamento do protótipo local, não esses serviços futuros.
