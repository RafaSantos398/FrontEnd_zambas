# Publicação do frontend Berxy

Site: **https://berxy.vercel.app**. Projeto existente: santos-fe39/berxy.
Repositório: RafaSantos398/FrontEnd_zambas, branch main, framework Vite.
Build: npm run build; saída: dist. VITE_API_URL=https://berxy-api.onrender.com,
sem /api. O backend permite a origem https://berxy.vercel.app em FRONTEND_ORIGINS.

## Atualizar

1. Executar npm test e npm run build, ou o build Docker que executa ambos.
2. Enviar main; a integração Git da Vercel cria o deploy automaticamente.
3. Conferir Ready, commit e domínio principal. Publicar antes o backend se o
   frontend passar a depender de contrato novo.
4. Testar login, mensagens e recursos alterados com dados autorizados.

A revisão de escopo do backend mantém detail/errors nos erros comuns; o cliente
HTTP permanece compatível. A atualização atual do frontend organiza a documentação
sem adicionar dependência ou trocar os contratos.

VITE_* é público: nunca usar senha do banco ou JWT_SECRET nessas variáveis.
Alterações de VITE_API_URL exigem novo build. Não adicionar URLs temporárias de
Preview ao CORS automaticamente. O backend usa Render Free e pode demorar no primeiro
acesso. Recarregar a página exige novo login, pois o JWT fica em memória.

[Guia dos arquivos](docs/GUIA-FRONTEND.md) · [Docker local](DOCKER.md).
