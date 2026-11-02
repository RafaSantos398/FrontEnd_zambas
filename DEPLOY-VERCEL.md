# Berxy na Vercel

Site público: **https://berxy.vercel.app**.
API pública: **https://berxy-api.onrender.com**.

## Configuração aplicada em 02/11/2026

- Projeto berxy, equipe Santos, plano Hobby.
- GitHub: RafaSantos398/FrontEnd_zambas, branch main.
- Framework Vite, diretório raiz ./, build npm run build, saída dist.
- VITE_API_URL=https://berxy-api.onrender.com nos ambientes Production e Preview.
- No Render, FRONTEND_ORIGINS inclui https://berxy.vercel.app e as origens
  locais já usadas no desenvolvimento, sem liberar todas as origens.

A URL da API é pública e faz parte do JavaScript compilado. Credenciais do
PostgreSQL e JWT_SECRET continuam somente no backend. Não colocar esses
segredos em variáveis VITE_*.

## Verificações realizadas

- Produção Ready na Vercel, commit c027bc0 da main.
- Página e JavaScript HTTP 200 por HTTPS; bundle aponta para a API do Render.
- Preflight da Vercel HTTP 200, com Access-Control-Allow-Origin exato.
- API sem token e login com credenciais inexistentes retornam 401 com CORS.
- Origem não permitida continua recebendo 403.
- Login pelo navegador mostrou “E-mail ou senha inválidos”, confirmando a
  resposta da API sem erro de CORS ou conteúdo misto.
- Não foram cadastradas contas ou planos de teste no PostgreSQL nesta rodada.
  Login bem-sucedido e operações autenticadas com uma conta real ainda não
  foram exercitados no domínio público nesta validação.

## Atualizar o site

Depois de testar as mudanças, enviá-las à main do repositório do frontend.
A integração da Vercel gera uma nova publicação. Conferir o resultado em
Deployments e testar o domínio principal antes da apresentação.

Alterações em VITE_API_URL exigem um novo build/deploy. No Render, alterações
em FRONTEND_ORIGINS exigem reiniciar a aplicação com a configuração salva.
URLs temporárias de Preview não foram incluídas no CORS: os testes integrados
devem usar o domínio principal acima.

O token fica na memória do React; atualizar a página exige novo login.
Como o backend usa o plano Free do Render, o primeiro acesso depois de um
período de inatividade pode demorar. Não é necessário deixar o computador
local ligado para que o site público funcione.

Referências: [Vite na Vercel](https://vercel.com/docs/frameworks/frontend/vite),
[variáveis no Vite](https://vite.dev/guide/env-and-mode),
[variáveis na Vercel](https://vercel.com/docs/environment-variables).
