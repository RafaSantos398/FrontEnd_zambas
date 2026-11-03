# Berxy Frontend

Interface React do planejador de intercâmbio Berxy, em JavaScript e CSS.

- **Site:** https://berxy.vercel.app
- **API:** https://berxy-api.onrender.com
- **Backend e manual do grupo:** https://github.com/RafaSantos398/Projeto_Final_Arquitetura_de_objetos_ageis
- [Guia de todos os arquivos do frontend](docs/GUIA-FRONTEND.md)
- [Guia completo do grupo](https://github.com/RafaSantos398/Projeto_Final_Arquitetura_de_objetos_ageis/blob/main/docs/GUIA-DO-GRUPO.md)
- [Classes e relações](https://github.com/RafaSantos398/Projeto_Final_Arquitetura_de_objetos_ageis/blob/main/docs/DIAGRAMAS.md)
- [Contratos da API](https://github.com/RafaSantos398/Projeto_Final_Arquitetura_de_objetos_ageis/blob/main/docs/API.md)
- [Revisão de escopo](https://github.com/RafaSantos398/Projeto_Final_Arquitetura_de_objetos_ageis/blob/main/docs/REVISAO-ESCOPO.md)

## Funcionalidades integradas

Cadastro/login JWT, conta/perfil e proficiências; planos com curso opcional;
cursos pessoais criados pelo usuário, com etiquetas, datas e link; inclusão no cronograma de planos;
catálogos administrativos; associação de modelos aos cursos; checklists por curso
ou seis temas com 24 sugestões; tarefas próprias, prazos e movimentação de status;
planejamento financeiro; preparação de idioma; caderno de anotações por tarefa.

Os cards recolhidos mostram só o título. Clicar abre detalhes; arrastar no computador
move entre colunas, e o seletor permite a mesma ação por teclado/celular. O link
“Abrir anotações” abre uma página própria, mantendo o checklist compacto. O caderno
aceita texto livre de até 10.000 caracteres e modelos opcionais por tema; o texto
fica no banco. Salvar é explícito, com aviso ao sair sem salvar.

## Tecnologias

React 19, JavaScript, HTML e CSS; Vite 8 para desenvolvimento/build. Não há
TypeScript, Tailwind, biblioteca de UI ou autenticação externa. SVGs dos componentes
e arraste usam recursos nativos. Valores e regras definitivas são validados no backend.

## Executar

```powershell
npm ci
npm run dev
```

Servidor local: http://127.0.0.1:5173. Base padrão da API: http://localhost:8080.
Configurar VITE_API_URL em arquivo local a partir de .env.example ou no ambiente.
A Vercel usa https://berxy-api.onrender.com, sem /api. A origem do frontend precisa
estar em FRONTEND_ORIGINS do backend. O Compose usa /api com proxy Nginx.

VITE_* aparece no JavaScript público: nunca inserir senha do banco ou JWT_SECRET.
A API usa Bearer; não enviar cookies para simular uma sessão do backend.

## Testar e publicar

```powershell
npm test
npm run build
```

Oito testes do cliente HTTP e build aprovados na revisão de 03/11/2026. O backend
correspondente passou nos 76 testes após simplificação de erros e validação de senha.
A Vercel acompanha main e publica automaticamente. Conferir Ready e o commit no
painel antes de considerar a atualização concluída. [Guia Vercel](DEPLOY-VERCEL.md).

Para executar o conjunto com Docker, seguir [DOCKER.md](DOCKER.md). O modo Local
usa H2 descartável e não grava no PostgreSQL publicado.

## Sessão e erros

Token somente no estado do React: recarregar exige novo login. Logout limpa dados,
formulários e resultados privados. Alterar email exige novo login. JWT dura uma hora;
o backend não revoga tokens anteriores na troca de senha e não usa refresh token.

api.js entende JSON, texto, 204 sem corpo, detail/errors e os handlers com mensagem.
401 leva ao login, 403 informa falta de permissão e 409 mantém dados para correção.
A revisão do backend usa DTO simples de erro; o cliente continua compatível.

## Limites

Não há cotação automática, recomendação de cursos, anexos, notificações ou modo offline.
Anotações não somam custos nem alteram finanças automaticamente. Duas abas não mesclam
edições do mesmo caderno. O catálogo depende de cadastro ADMIN, mas os principais
fluxos de organização funcionam sem curso. O primeiro acesso ao Render Free pode demorar.


## Meus cursos

O usuário cadastra e edita seus cursos, sem pedir a um administrador ou depender de
instituição do catálogo. Pode combinar etiquetas Financeiro, Linguístico, Acadêmico,
Profissional, Cultural e Outros, informar plataforma, link, idioma e datas. A listagem
não mostra cursos pessoais de outras contas. Filtrar por etiqueta ajuda a organizar.

Adicionar ao cronograma permite escolher um plano e cria uma etapa no checklist com
prazo igual ao término previsto. Repetir a ação preserva a mesma etapa. Alterar o curso
não sobrescreve datas, progresso ou anotações de etapas existentes: ajustar no checklist.
Dentro do plano, Cursos mostra primeiro os cursos de apoio; curso principal do catálogo
continua disponível em seção opcional recolhível. Cursos pessoais não exigem curso principal.

Contrato: POST /cursos/pessoais, PUT /cursos/pessoais/{id}, GET /cursos (catálogo + próprios),
POST /planos-intercambio/{id}/tarefas/curso com cursoId. Publicar após migração
20261103-cursos-pessoais.sql e backend correspondente. Etiquetas/datas vêm da API real.


## Área de estudo do curso

O cadastro/edição pessoal permite selecionar AreaEstudo existente ou criar nova área.
O catálogo administrativo também permite escolher a área. A listagem mostra o nome
vindo da entidade e permite filtro por área, independente do filtro de etiquetas.
A nova área é categoria compartilhada; o curso pessoal permanece privado.

Request de curso inclui areaEstudoId ou areaEstudoNome; response devolve ID/nome.
Null em ambos remove o vínculo no PUT. Migração backend 20261103-area-do-curso.sql
precisa estar aplicada antes da publicação desta interface. Não há biblioteca nova.
