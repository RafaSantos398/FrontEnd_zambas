# Berxy — Frontend

Aplicação React com JavaScript e CSS, integrada ao backend Spring Boot do projeto.
A exportação do Figma foi corrigida e convertida de TypeScript/Tailwind para
JavaScript/CSS, preservando a marca, o mascote e as telas.

## Executar localmente

Pré-requisito: Node.js 24 (versão usada na validação) e npm.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Abra http://127.0.0.1:5173. Inicie também o backend na porta 8080.
O projeto não presume que o servidor do Figma esteja disponível no computador.
Se a porta 5173 estiver ocupada, o Vite informa o conflito em vez de trocar
silenciosamente para uma origem que o backend não permite.

A URL da API é configurada em `.env.local`:

```text
VITE_API_URL=http://localhost:8080
```

Essa URL não tem o prefixo `/api`. Reinicie o Vite depois de mudar o arquivo.
A variável é pública e entra no build: nunca coloque senhas, JWT_SECRET ou
credenciais do PostgreSQL em variáveis VITE_.

No backend, `FRONTEND_ORIGINS` controla a lista de origens permitidas, separadas
por vírgula. As origens locais padrão incluem localhost/127.0.0.1 nas portas
5173 e 4173. Na publicação, ajustar a URL da API e a origem real do frontend.
Não é necessário enviar cookies: a autenticação usa Authorization: Bearer.

## O que está integrado

- Cadastro e login JWT, consulta do usuário e logout com limpeza imediata.
- Planos: listagem, criação, edição, status e escolha de curso.
- Exibição do curso recuperado do backend por cursoId/cursoNome.
- Checklist: geração, sincronização, início, conclusão, reabertura e prazo.
- Preparação de idioma: cadastro, edição, início e conclusão.
- Perfil do intercambista, proficiências, dados da conta e troca de senha.
- Administração: criação/edição de instituições, áreas, cursos e modelos.
- Ativação/desativação de cursos e desativação de modelos.
- Associação e remoção de modelos dos cursos.

Uma conta USER vê os próprios dados. A administração é exibida apenas para
ADMIN; a autorização também é conferida pelo backend. Não existe promoção
pública para ADMIN nem uma senha padrão cadastrada por este frontend.

## Autenticação e erros

O token fica somente no estado do React: recarregar a página exige novo login.
Sair limpa os dados privados e fecha formulários. Respostas atrasadas de uma
sessão anterior não atualizam os dados da nova conta.

Os erros application/problem+json, application/json e texto são tratados.
As respostas 204 não são interpretadas como JSON. Ao receber 401, o frontend
volta ao login; 403 informa falta de permissão. Conflitos 409 preservam o
formulário para correção. Alterar o e-mail exige entrar novamente.

O JWT expira em uma hora. Logout descarta o token no cliente; o backend da
Aula 14 não mantém lista de revogação. Senhas e chaves privadas não são
armazenadas pelo frontend.

## Organização

- src/App.jsx: navegação, autenticação, listagem e formulário dos planos.
- src/PlanDetail.jsx: curso, checklist e preparação de idioma.
- src/ProfilePage.jsx: perfil e conta.
- src/AdminPage.jsx: catálogos e associações.
- src/api.js: acesso HTTP centralizado e tratamento de erros.
- src/components.jsx: componentes visuais, logotipo e urso.
- src/types.js: rótulos dos enums da API, em JavaScript.
- src/useDialog.js: foco, Tab e Escape dos formulários em diálogo.
- src/index.css: estilos e responsividade, sem Tailwind.
- vite.config.js: configuração React/Vite.
- tests/api.test.mjs: testes do cliente HTTP com node:test.

## Verificações realizadas em 02/11/2026

```powershell
npm test
npm run build
```

- 8 testes do cliente HTTP aprovados e build de produção aprovado.
- 58 testes do backend aprovados em H2, incluindo CORS e curso do plano.
- Fluxos testados no navegador contra o JAR real, em H2 temporário:
  cadastro/login; CRUD administrativo; associação/remoção de modelos;
  criação de plano, curso, tarefas, sincronização sem duplicação;
  transições das tarefas; cadastro/edição/conclusão de preparação;
  perfil e proficiência; navegação desktop e mobile; tratamento de conflito;
  perda de acesso com formulário aberto e isolamento ao trocar de usuário.
- O PostgreSQL do Render não recebeu os dados desses testes de interface.
  A suíte anterior de 55 testes já havia sido validada nesse PostgreSQL;
  esta rodada de 58 testes foi local, sem mudança no esquema de tabelas.

## Checklists independentes de curso e finanças

Os formulários compartilham campos com bordas arredondadas, foco visível,
selects padronizados e estados desabilitados. A edição de tarefa distingue
campos obrigatórios/opcionais e inclui dicas e placeholders. Os detalhes da
tarefa usam rótulos associados aos campos, tags de categoria e ação de remoção
distinta. Os valores financeiros ficam lado a lado no desktop e empilhados em
telas menores. Ajuste visual sem mudanças no contrato da API ou no banco.
Validação: build de produção/Docker, 8 testes HTTP do frontend e navegador
com edição, seleção de status e prazo escolhido pelo calendário.

O quadro agora mostra só os títulos das tarefas recolhidas. Clicar abre a
descrição, o prazo, a edição e a remoção. Arrastar pelo título muda a tarefa
entre Pendentes, Em andamento e Concluídas; o seletor Mover para oferece a
mesma operação por teclado ou no celular. A mudança só aparece após a API
confirmar, e falhas preservam a coluna anterior. Os temas ficam recolhidos
quando o plano já tem tarefas. Implementação em src/TaskBoard.jsx, com React
e a API nativa de arrastar e soltar, sem bibliotecas adicionais.

Esta atualização usa PATCH /planos-intercambio/{id}/tarefas/{idTarefa}/status,
com {"status":"EM_ANDAMENTO"}, por exemplo. O backend faz a mudança em uma
transação, preserva a data de uma conclusão repetida e limpa essa data ao sair
de Concluída. Nenhuma alteração de esquema é necessária. Validação: 69 testes
do backend, 8 do frontend, build Docker e arraste real no navegador, incluindo
retorno de Concluída para Pendente, abertura por teclado e seletor de status.

O plano permite escolher seis temas com 24 sugestões, mesmo com o catálogo de
cursos vazio. Nova tarefa cria itens próprios; Editar e Remover permitem adaptar
o checklist. Adicionar o mesmo tema mantém tarefas, prazos e conclusões existentes.
O botão de tarefas do curso continua disponível quando houver um curso selecionado.

A aba Finanças salva a meta total, a reserva atual e o aporte mensal. Mostra
quanto falta, meses completos disponíveis, aporte necessário, meses para a meta
e previsão até o início. A meta também atualiza o orçamento do resumo. Os
valores usam a moeda do plano e as estimativas do usuário, sem conversão ou juros.

Componentes adicionados: src/ChecklistTools.jsx e src/FinancePage.jsx.
Backend necessário: endpoints /tarefas/temas, /tarefas/gerar-temas, CRUD de
tarefas próprias e GET/PUT /financeiro. Antes de publicar, aplicar a migração
20261102-checklists-financas.sql no backend, publicar a API e só então o frontend.

Validação desta versão: 67 testes do backend no H2 e no PostgreSQL 18 local,
8 testes do frontend, builds de produção e Docker, interface real com catálogo
vazio, geração por tema sem duplicação, tarefas próprias e valores financeiros
persistidos. Os testes que criam contas e tarefas usaram apenas o H2 local.

## Publicação e execução

Docker está configurado e validado com o PostgreSQL do Render. Consulte
[DOCKER.md](DOCKER.md) para iniciar, testar e parar os containers. O site local
com Docker usa http://localhost:3000 e encaminha /api/ ao backend.

Frontend publicado: **https://berxy.vercel.app**.
Backend publicado: **https://berxy-api.onrender.com**.
Consulte [DEPLOY-VERCEL.md](DEPLOY-VERCEL.md) para configuração e atualizações.
VITE_API_URL aponta para a API HTTPS, sem /api; FRONTEND_ORIGINS no Render
inclui o domínio principal da Vercel.
O build estático sai em dist/; `npm run preview` permite conferi-lo localmente
na porta 4173. A URL pública do backend deverá estar correta antes de gerar
o build que será publicado.

O perfil dev do backend usa H2 em memória e perde dados ao reiniciar. Para
persistir dados de uso, iniciar o backend no perfil prod com PostgreSQL,
DB_URL, DB_USERNAME, DB_PASSWORD e JWT_SECRET configurados fora do frontend.

## Caderno das tarefas

“Checklist → expandir tarefa → Abrir anotações” abre uma página própria e mantém
o quadro compacto. O caderno aceita até 10.000 caracteres, texto livre e modelo
opcional por tema. O modelo só preenche texto vazio. Salvar é explícito; a página
mostra alterações pendentes, confirmação e horário do último salvamento. Voltar
ao checklist ou fechar/recarregar a aba avisa quando há texto não salvo.

Integração: GET/PUT `/planos-intercambio/{planoId}/tarefas/{tarefaId}/anotacoes`,
Bearer JWT. PUT `{ "texto": "..." }`; retorno `{ tarefaId, texto, atualizadoEm }`.
Não usa localStorage nem simula persistência. Publicar somente depois da migração
aditiva e do deploy correspondente do backend.

Validação: build Docker e 8 testes do frontend aprovados. Navegador local/H2:
modelo de moradia, gravação, recarga com novo login, texto preservado, modelo
bloqueado quando há texto e confirmação de saída pelo menu com opção de continuar.
