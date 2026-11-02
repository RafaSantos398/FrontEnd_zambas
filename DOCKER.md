# Berxy com Docker

O Docker Desktop deve estar aberto, usando containers Linux. Java e Node não
precisam estar instalados no computador para este modo: o build roda dentro
dos containers, incluindo os testes.

## Como funciona

Navegador → http://localhost:3000 → Nginx com React → /api/ → Spring Boot → PostgreSQL do Render.

O Nginx serve o frontend e encaminha /api/ ao backend, removendo esse prefixo.
O backend não publica a porta 8080 no computador. O PostgreSQL continua no
Render, com SSL; não é criado outro banco no Docker.

As imagens usam builds em múltiplas etapas: Java 26 JDK para compilar e JRE
para executar; Node 24 para compilar React e Nginx para servir os arquivos.
Referência: [builds em múltiplas etapas](https://docs.docker.com/build/building/multi-stage/).

## Iniciar com PostgreSQL

Abra o PowerShell nesta pasta do frontend e execute:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\iniciar-docker.ps1 -BackendPath "C:\Users\rafa3\Downloads\FireShot\projeto\projeto"
```

Em outro computador, ajuste BackendPath para a pasta que contém pom.xml e o
Dockerfile do backend. Informe o hostname externo do PostgreSQL, o usuário e
a senha atuais quando o script pedir. A senha é digitada de forma oculta;
o script não redefine a senha nem grava a senha do banco em arquivos do projeto.

Depois, acesse **http://localhost:3000**. O primeiro build pode levar alguns
minutos. Nas próximas execuções, o Docker reaproveita o cache. Para reutilizar
as imagens existentes sem reconstruir, acrescente `-NoBuild`.

O banco padrão é projeto_intercambio, porta 5432. Os parâmetros DatabaseName,
DatabasePort e FrontendPort permitem mudar esses valores. DatabaseHost e
DatabaseUser também podem ser passados como parâmetros públicos.

O script gera uma chave JWT estável em .docker-jwt-secret.local se JWT_SECRET
não estiver definida no ambiente. Esse arquivo é ignorado pelo Git e pelo
build. Preserve a chave entre reinicializações. A senha do banco é passada
somente no ambiente de execução do container; quem administra o Docker local
pode inspecionar esse ambiente. Não compartilhe saídas completas de inspect/config.

O perfil prod valida as tabelas existentes (`ddl-auto=validate`); não cria nem
recria o esquema. Para um banco novo, siga primeiro a inicialização documentada
no backend. Falhas de credenciais ou de esquema impedem a inicialização.

## Conferir e parar

Execute na pasta do frontend:

```powershell
docker compose -p berxy -f compose.yaml ps
docker compose -p berxy -f compose.yaml logs --tail 80 -f
docker compose -p berxy -f compose.yaml down
```

Ctrl+C encerra a visualização dos logs. O comando down para os containers;
o PostgreSQL externo e seus dados permanecem no Render.

Os healthchecks verificam a porta do backend e o HTTP do frontend. O Compose
espera o backend ficar saudável antes de iniciar o frontend, conforme a
[documentação de dependências](https://docs.docker.com/compose/how-tos/startup-order/).
O launcher também confere HTTP 200 no site e 401 na API sem autenticação.

## Modo local para testes sem usar o Render

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\iniciar-docker.ps1 -BackendPath "C:\Users\rafa3\Downloads\FireShot\projeto\projeto" -Local -FrontendPort 3001
```

Esse modo usa outro projeto Compose, berxy-local, com H2 em memória. Os dados
são temporários e desaparecem quando o backend é reiniciado. A chave JWT desse
modo é pública e exclusiva para validação local. Não use esse perfil em produção.

```powershell
docker compose -p berxy-local -f compose.yaml -f compose.local.yaml down
```

## Configuração e futura publicação

.env.docker.example documenta as variáveis. O launcher evita precisar gravar
a senha em um .env. Nunca coloque DB_PASSWORD ou JWT_SECRET em VITE_*.

No Docker Compose, VITE_API_URL é /api e é incorporada durante o build.
Se o frontend for publicado separadamente na Vercel, configure VITE_API_URL
com a URL HTTPS real do backend, sem o prefixo /api, antes de gerar o build.
Configure FRONTEND_ORIGINS no backend com a origem HTTPS exata do frontend.

Para publicar apenas o backend no Render usando Docker, o diretório raiz é
`projeto` dentro do repositório do backend: a pasta com pom.xml e Dockerfile.
Configure SPRING_PROFILES_ACTIVE=prod, DB_URL (JDBC com sslmode=require),
DB_USERNAME, DB_PASSWORD, JWT_SECRET e FRONTEND_ORIGINS no ambiente do serviço.
A aplicação respeita PORT fornecida pela plataforma. Não coloque essas
credenciais no Dockerfile ou no Git.

O backend foi publicado no Render em 02/11/2026:
**https://berxy-api.onrender.com** (Docker, plano Free, commit 256ba59).
Para o frontend na Vercel, usar `VITE_API_URL=https://berxy-api.onrender.com`.
O frontend também foi publicado: **https://berxy.vercel.app**.
Essa origem HTTPS foi adicionada a FRONTEND_ORIGINS no Render.
Consulte DEPLOY-VERCEL.md para atualizar a publicação.

## Validação atual

Revisão de 02/11/2026: 72 testes do backend, 8 testes do frontend e builds Docker
aprovados no modo isolado com H2. A produção usa PostgreSQL com validate; as migrações
aditivas de temas/finanças e caderno já foram aplicadas. A revisão de escopo não exige
nova migração. O frontend da Vercel chama diretamente a API HTTPS, sem Nginx ou /api.

As instruções acima de criação do serviço referem-se à publicação inicial. Hoje,
os dois repositórios entregam pela main; atualizar o serviço já existente no Render,
sem criar outro. Ver DEPLOY-VERCEL.md e o manual do backend.
