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

Oito testes do cliente HTTP e build aprovados na revisão de 02/11/2026. O backend
correspondente passou nos 72 testes após simplificação de erros e validação de senha.
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
