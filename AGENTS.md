# Berxy — instruções do repositório

## Escopo

O usuário exige manter as tecnologias dentro do material da disciplina e do
escopo aprovado do projeto. Referência:
https://ezambomsantana.github.io/arquitetura-objetos-site/

O frontend é React com JavaScript, HTML e CSS. A exportação inicial do Figma
usava TypeScript/Tailwind; ela foi convertida por solicitação do usuário.
Não reintroduzir TypeScript, Tailwind, bibliotecas de UI, autenticação externa
ou outro framework sem uma instrução explícita do usuário.

## Estrutura e execução

- src/main.jsx monta src/App.jsx e importa src/index.css.
- src/App.jsx contém navegação e autenticação.
- src/PlanDetail.jsx contém os fluxos do plano.
- src/ProfilePage.jsx contém perfil e conta.
- src/AdminPage.jsx contém catálogos e associação de modelos a cursos.
- src/api.js centraliza fetch e Bearer; o backend não usa sessão por cookie.
- vite.config.js configura React/Vite; usar npm ci e npm run dev.
- O servidor local usa 127.0.0.1:5173. Verificar se está rodando antes de abrir
  outro processo; não presumir o ambiente de preview do Figma.
- npm test executa os testes nativos do Node; npm run build gera dist/.

## Integração

A base padrão é http://localhost:8080, configurável por VITE_API_URL.
FRONTEND_ORIGINS é uma variável do backend para permitir origens explícitas.
Não incluir credenciais do banco nem JWT_SECRET no código do frontend.

Preservar os contratos reais do backend; não simular endpoints ou persistência.
As respostas de plano incluem cursoSelecionado, cursoId e cursoNome.
O logout limpa dados privados, formulários e resultados da sessão anterior.
Registre alterações de contrato e testes no README. Docker está configurado;
consulte DOCKER.md. Site público: https://berxy.vercel.app; API pública:
https://berxy-api.onrender.com. Consulte DEPLOY-VERCEL.md. Não adicionar
origens temporárias de Preview ao CORS automaticamente.
