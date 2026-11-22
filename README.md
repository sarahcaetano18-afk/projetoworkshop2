# Eskgo

Aplicativo de finanças pessoais mobile-first em **React 19, TypeScript, Vite 8 e Tailwind CSS v4**. Projeto frontend independente, que pode ser aberto em outro editor e publicado em qualquer hospedagem de sites estáticos.

## Executar

Requer Node.js 22 e pnpm 10.34.3, conforme `.mise.toml`.

```sh
pnpm install
pnpm dev
```

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm preview
pnpm format
```

O build de produção é gerado em `dist/`. O Vite config é standalone (sem plugins exclusivos do Figma Make).

## Escopo desta versão

Estágio 1 demonstrativo e prévia visual do Plus, sem IA conectada:

- Home com saldo ocultável, gastos do mês, categorias e registros.
- Cadastro, edição e exclusão de gastos em uma folha.
- Carteira empilhada, cadastro e edição de cartões, limites e faturas manuais.
- Orçamento mensal e tetos por categoria.
- Criação de metas e registro de valores guardados, descontados do saldo.
- Folha de conta e saída da demonstração.
- Login, cadastro e recuperação de acesso demonstrativos, sem Google.
- Fatura: selecionar PDF/foto ou exemplo, progresso simulado, revisão de compras, confirmação e conclusão.
- Assistente local com respostas por regras usando os registros da demonstração.
- Card lilás de acesso ao Assistente em Metas.
- Barra mobile com Início, Fatura, Adicionar gasto, Cartões e Metas.
- Formulários validados, feedback por toast e estado vazio.
- Navegação por views, com URLs `#cards`, `#goals`, `#invoice`, `#assistant`, `#login` e `#signup`.
- Novas telas carregadas sob demanda com `React.lazy` e `Suspense`.

Dados iniciais fictícios do Lucas. Os lançamentos usam a data de abertura da demonstração para que o resumo represente o mês atual. O comparativo inicial de 12% usa um valor de referência fictício do mês anterior. As faturas têm um valor inicial manual; novos gastos alteram esse valor.

## Responsividade

Tokens semânticos `--eg-*` em `src/index.css`. O mobile mantém a ordem do Figma: saldo, atalhos, mês, carteira e registros. A partir de 800 px, a mesma home usa duas colunas, sem sidebar. Ajustes adicionais em 1100, 1600 e 2400 px atendem desktop, Full HD e 4K, com largura de conteúdo limitada para manter a leitura confortável.

## Persistência e limites

Os dados são salvos em `localStorage`, na chave `eskgo-v1`, **somente neste navegador**. Não há autenticação real, banco de dados, sincronização, conexão bancária ou armazenamento seguro para dados financeiros de produção. “Sair” encerra apenas a demonstração visual; não representa uma sessão autenticada.

O estágio 2 tem apenas uma **prévia de interface**. Selecionar um arquivo não o envia nem interpreta seu conteúdo: a revisão usa 10 compras fictícias, totalizando R$ 1.284, com 3 assinaturas. É possível ajustar categorias/valores e desmarcar compras antes de confirmar. Os registros selecionados entram no mesmo estado dos gastos manuais. A chave da demonstração e os IDs dos registros impedem a repetição da mesma importação; arquivos próprios são identificados por metadados e cartão, não por análise do conteúdo. Compras já digitadas manualmente precisam ser desmarcadas na revisão.

O Assistente não chama OpenAI: suas respostas seguem regras locais para delivery, assinaturas, orçamento, cartões e objetivo principal. A conversa fica em memória no nível do app: trocar de tela não interrompe a resposta. Há parar, tentar novamente e nova conversa; sair da demonstração limpa/cancela a conversa. O adapter `AssistantGateway` recebe contexto/histórico e `AbortSignal`, preparado para substituição por um endpoint do próprio backend. Não há envio de mensagens ou arquivos.

Login e cadastro têm acesso livre: basta clicar no botão principal, sem preencher nome, e-mail, senha ou confirmação. Campos preenchidos também não bloqueiam a entrada; não há verificação de credenciais. Sem preenchimento, o app usa o perfil de exemplo do Lucas. Senhas não são lidas pelo fluxo de entrada, salvas ou transmitidas. O nome/e-mail de demonstração ficam apenas na memória, e não existem contas separadas ou controle de acesso. Recuperação de senha ainda valida o formato do e-mail, mas não envia mensagens. Não use credenciais reais nesta demonstração.

Para evoluir, conectar autenticação e persistência no servidor antes de implementar a IA. Uma migração para Next.js não é necessária para publicar esta versão estática.

## Validação

```sh
pnpm exec tsc --noEmit
node --experimental-strip-types --test src/lib/prototype.test.ts src/services/assistant.test.ts
pnpm build
```

Os 22 testes de lógica/serviço cobrem valores da fatura de exemplo, arquivos aceitos/rejeitados, criação e deduplicação de lançamentos, validador de credenciais futuro, cálculos do assistente, limite de saldo, mês atual, valores ocultos, cancelamento e formatação monetária. Login/Cadastro da interface permanecem livres.

A suíte `scripts/validate-flows.mjs` usa Playwright/Chromium em um contexto isolado para testar ciclos completos em 390 e 1440 px, sete telas em oito larguras (até 3840 × 2160), movimento reduzido e erros de runtime. Usa o servidor existente; não inicia outro servidor. Playwright pode ser instalado fora do projeto e indicado por `ESKGO_TEST_TOOLS` (pasta contendo o `package.json` e `node_modules` da ferramenta). Informe a URL local real em `ESKGO_TEST_URL`.

O checklist completo, evidências e limites estão em `VALIDATION.md`. O contrato de integração e as pendências de modelo/segurança estão em `BACKEND_HANDOFF.md`.

## Referências visuais

Home baseada na referência “01 · Aura — Home”: preto, lima e lilás; gradiente no saldo; ativos SVG originais em `public/assets`. Fontes Manrope e IBM Plex Mono resolvidas pelo Figma e declaradas em `src/index.css`.
