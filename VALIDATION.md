# Eskgo — checklist de fechamento do front-end

## Como ler este checklist

- **E**: interação ou geometria verificada em Chromium automatizado.
- **U**: regra verificada por teste unitário.
- **I**: implementado e inspecionado no código; sem afirmação de teste completo de navegador.
- Caixas abertas são pendências reais, não aprovações.

As telas continuam demonstrativas. Este fechamento não afirma autenticação real, extração de arquivos, IA conectada ou aprovação visual humana.

## 1. Mapa de telas

- [x] **E** Home: saldo, mês, registros, carteira e atalhos.
- [x] **E** Cartões: carteira, limite, vencimento e acesso à Fatura.
- [x] **E** Metas: orçamento e objetivos na mesma tela.
- [x] **E** Fatura: escolher → processar exemplo → revisar → confirmar → registros.
- [x] **E** Assistente: acesso, conversa, contexto e retorno.
- [x] **E** Login livre, sem preencher credenciais.
- [x] **E** Cadastro livre, sem preencher dados.
- [x] **E** Recuperação demonstrativa como estado do acesso, sem enviar e-mail.
- [x] **I** Gastos, cartões, nova meta, aporte, teto e conta continuam em folhas.
- [x] **I** Sem telas extras de Gastos/Objetivos, sem quinta aba de Assistente e sem sidebar.

## 2. Acesso, conta e privacidade

- [x] **E** Login vazio entra com o perfil Lucas.
- [x] **E** Cadastro vazio entra na demonstração.
- [x] **E** Conta → confirmação de saída → Login.
- [x] **E** Recuperação informa que nenhum e-mail foi enviado.
- [x] **E** Ocultar valores também mascara respostas já existentes no chat.
- [x] **E** Os dados financeiros permanecem após recarregar a página no mesmo navegador.
- [x] **I** Senhas não são usadas para autenticar, salvas ou transmitidas.
- [x] **I** Saída limpa e cancela a conversa da demonstração.

## 3. Gastos e cartões

- [x] **E** Formulário de gasto vazio não grava registro.
- [x] **E** Gasto com centavos altera saldo, mês e fatura pelo valor exato.
- [x] **E** Editar compra aplica somente a diferença.
- [x] **E** Apagar compra restaura saldo/mês/fatura.
- [x] **E** Novo cartão aparece na carteira e na lista.
- [x] **E** Apelido duplicado mantém a folha aberta e exibe erro.
- [x] **E** Editar cartão preserva a fatura manual informada.
- [x] **E** Renomear cartão preserva a fatura e a associação das compras.
- [x] **E** Compra após renomear cartão atualiza a fatura corretamente.
- [x] **E** Toque na pilha e seleção por indicadores trocam o cartão ativo.
- [x] **U/I** Valores não finitos, negativos, zero indevido ou com mais de duas casas são rejeitados.
- [x] **I** Carteira vazia tem CTA de primeiro cartão.

## 4. Fatura

- [x] **E** Seleção de arquivo pela interface.
- [x] **U** PDF/JPG/PNG/WebP aceitos pela validação de metadados.
- [x] **E/U** Arquivo vazio, formato incompatível e tamanho acima de 10 MB são rejeitados.
- [x] **E** Fatura de exemplo vinculada ao cartão escolhido.
- [x] **E** Progresso pode ser cancelado e reiniciado.
- [x] **E** Revisão permite alterar categoria/valor e desmarcar compras.
- [x] **E** Confirmação gera somente as compras selecionadas.
- [x] **E** Saldo e mês mudam após a confirmação.
- [x] **E** Tela de conclusão leva aos registros na Home.
- [x] **E/U** Confirmar o mesmo lote novamente não duplica registros.
- [x] **U** IDs repetidos no próprio lote são deduplicados.
- [x] **I** Arquivo não é enviado nem interpretado; exemplos são identificados como fictícios.
- [x] **I** Aviso orienta desmarcar compras já digitadas manualmente.

## 5. Metas e orçamento

- [x] **E** Ajustar teto mensal atualiza o valor disponível.
- [x] **E** Ajustar teto de categoria salva a alteração.
- [x] **E** Nova meta aparece na lista.
- [x] **E** Guardar R$ 500 aumenta o guardado e reduz o saldo em R$ 500.
- [x] **E** Aporte acima do saldo é bloqueado.
- [x] **I** Metas vazias, meta conquistada e orçamento excedido têm apresentação própria.
- [x] **U** Planejamento do Assistente não sugere aporte acima do saldo disponível.

## 6. Assistente — prioridade

- [x] **E** Acesso pelo card lilás em Metas, no mobile e desktop.
- [x] **E** Perguntas sugeridas iniciam conversa.
- [x] **E** Mensagem digitada pode ser enviada por Enter ou botão.
- [x] **E** Estado de espera visível antes da resposta.
- [x] **E** Respostas exibem número, contexto e consequência.
- [x] **E/U** Delivery usa os lançamentos locais; não inventa o valor de referência do briefing.
- [x] **U** Assinaturas, orçamento, cartões e metas usam regras locais.
- [x] **E** Parar interrompe a resposta e apresenta feedback.
- [x] **E** Tentar novamente retoma a pergunta sem duplicar a bolha do usuário.
- [x] **E** Trocar de tela durante o processamento não perde a resposta.
- [x] **E** Voltar ao Assistente preserva a conversa enquanto o app está aberto.
- [x] **E** Nova conversa durante uma resposta cancela a antiga, sem resposta atrasada reaparecendo.
- [x] **E** Valores ocultos não são revelados pelas respostas anteriores.
- [x] **U** Gateway reconhece cancelamento prévio e durante o processamento.
- [x] **I** Hook tem tratamento de erro/timeout e CTA de nova tentativa.
- [x] **I** Interface informa que não há OpenAI conectada.
- [ ] Erros reais de HTTP, indisponibilidade da OpenAI e streaming — validar quando houver backend.

## 7. Feedback, acessibilidade e microinterações

- [x] **E** Escape fecha a folha.
- [x] **E** Ao fechar a folha, o foco retorna ao botão de origem.
- [x] **I** Tab fica contido na folha; controles desabilitados são excluídos.
- [x] **I** Erros dos formulários financeiros aparecem dentro da folha.
- [x] **I** Toasts têm botão de dispensar.
- [x] **I** Transições de tela, resposta do chat, carteira e sucesso.
- [x] **I** Feedback de pressionar nos botões e hover sutil.
- [x] **I** Animações de progresso, digitação e preparação da fatura.
- [x] **E** Preferência por movimento reduzido desliga animações/transições.
- [x] **I** Mensagens de status/erro têm regiões acessíveis.
- [ ] Auditoria formal WCAG, leitor de tela e validação em dispositivo físico.

## 8. Responsividade e qualidade

- [x] **E** Sete telas sem overflow horizontal em 360, 390, 440, 768, 800, 1100, 1920 e 3840 px.
- [x] **E** Full HD 1920 × 1080 e 4K 3840 × 2160 contemplados na suíte.
- [x] **E** Barra mobile visível abaixo de 800 px e oculta no desktop.
- [x] **E** Botões da barra mobile têm largura e altura iguais.
- [x] **E** Ciclos financeiros e chat completos em 390 e 1440 px.
- [x] **E** Nenhum erro de runtime nas execuções automatizadas.
- [x] **U** 22 testes de lógica/serviço aprovados.
- [x] TypeScript e build de produção aprovados.
- [ ] Aprovação visual humana de tipografia, espaçamento e timing das animações.
- [ ] Safari/iOS, Firefox e dispositivos reais.

## 9. Handoff para backend

- [x] Adapter tipado `AssistantGateway`, sem segredo no cliente.
- [x] `AbortSignal`, histórico e contexto financeiro definidos.
- [x] Contratos e ajustes de modelo documentados em `BACKEND_HANDOFF.md`.
- [x] Suite reproduzível de navegador em `scripts/validate-flows.mjs`.
- [ ] Auth real, autorização, isolamento de usuário e recuperação por e-mail.
- [ ] Banco de dados, concorrência e sincronização.
- [ ] Vínculos por IDs estáveis e modelo de saldo/fatura de produção.
- [ ] Upload seguro, extração OpenAI e confirmação idempotente no servidor.
- [ ] Chat/insights reais, limites de uso, observabilidade e streaming.

## Execuções

```sh
pnpm exec tsc --noEmit
node --experimental-strip-types --test src/lib/prototype.test.ts src/services/assistant.test.ts
pnpm build
```

O navegador exige Playwright e Chromium instalados no ambiente de teste. Ele usa um contexto isolado, sem alterar os registros da preview do usuário, e o servidor já existente:

```sh
ESKGO_TEST_TOOLS=/tmp/eskgo-validation ESKGO_TEST_URL=http://localhost:3000 node scripts/validate-flows.mjs
```

A suíte completa tem 69 grupos/verificações: 12 ciclos agrupados (6 em cada dispositivo), 56 combinações tela/largura e 1 verificação de movimento reduzido. Há também execução direcionada por `ESKGO_LAYOUT_ONLY=1 ESKGO_TEST_WIDTHS=3840`.

Não houve commit, push, conexão de backend ou publicação nesta entrega.
