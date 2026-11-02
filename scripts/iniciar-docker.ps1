param(
    [Parameter(Mandatory = $true)]
    [string]$BackendPath,
    [string]$DatabaseHost,
    [ValidatePattern('^[a-zA-Z_][a-zA-Z0-9_]*$')]
    [string]$DatabaseName = 'projeto_intercambio',
    [string]$DatabaseUser,
    [ValidateRange(1, 65535)]
    [int]$DatabasePort = 5432,
    [ValidateRange(1, 65535)]
    [int]$FrontendPort = 3000,
    [switch]$Local,
    [switch]$NoBuild,
    [string]$StatusFile,
    [switch]$PauseWindow
)

$ErrorActionPreference = 'Stop'
$frontendRoot = Split-Path -Parent $PSScriptRoot
$oldDirectory = (Get-Location).Path
$environmentNames = @('BACKEND_CONTEXT', 'FRONTEND_PORT', 'DB_URL', 'DB_USERNAME', 'DB_PASSWORD', 'JWT_SECRET')
$previousEnvironment = @{}
foreach ($environmentName in $environmentNames) {
    $previousEnvironment[$environmentName] = [Environment]::GetEnvironmentVariable($environmentName, 'Process')
}
$projectName = if ($Local) { 'berxy-local' } else { 'berxy' }
$siteUrl = "http://localhost:$FrontendPort"

function Write-DockerState([string]$State, [string]$Message) {
    if ($StatusFile) {
        [ordered]@{ state = $State; message = $Message; url = $siteUrl;
            project = $projectName; mode = $(if ($Local) { 'h2' } else { 'postgresql' }) } |
            ConvertTo-Json | Set-Content -LiteralPath $StatusFile -Encoding UTF8
    }
}

function Invoke-Docker([string[]]$Arguments) {
    $ErrorActionPreference = 'Continue'
    & docker @Arguments
    $dockerExit = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    if ($dockerExit -ne 0) { throw "O Docker retornou erro $dockerExit. Confira as mensagens acima." }
}

$scriptExit = 0
try {
    $resolvedBackend = (Resolve-Path -LiteralPath $BackendPath).Path
    if (-not (Test-Path -LiteralPath (Join-Path $resolvedBackend 'pom.xml')) -or
        -not (Test-Path -LiteralPath (Join-Path $resolvedBackend 'Dockerfile'))) {
        throw 'BackendPath precisa apontar para a pasta que contem pom.xml e Dockerfile.'
    }
    $env:BACKEND_CONTEXT = $resolvedBackend.Replace('\', '/')
    $env:FRONTEND_PORT = $FrontendPort.ToString()
    Set-Location -LiteralPath $frontendRoot
    Write-DockerState 'checking_docker' 'Conferindo o Docker Desktop.'
    Invoke-Docker @('info', '--format', '{{.OSType}}')

    $composeArguments = @('compose', '-p', $projectName, '-f', (Join-Path $frontendRoot 'compose.yaml'))
    if ($Local) {
        $composeArguments += @('-f', (Join-Path $frontendRoot 'compose.local.yaml'))
        Write-Host 'Modo local: H2 em memoria. Nenhuma conexao com o Render.' -ForegroundColor Yellow
    } else {
        Write-DockerState 'awaiting_credentials' 'Informe host, usuario e senha atuais na janela local.'
        if ([string]::IsNullOrWhiteSpace($DatabaseHost)) {
            $DatabaseHost = Read-Host 'Hostname EXTERNO do PostgreSQL no Render (sem protocolo)'
        }
        if ($DatabaseHost -notmatch '^[a-zA-Z0-9.-]+$') { throw 'Hostname invalido.' }
        if ([string]::IsNullOrWhiteSpace($DatabaseUser)) {
            $DatabaseUser = Read-Host 'Usuario atual do PostgreSQL mostrado no Render'
        }
        if ($DatabaseUser -notmatch '^[a-zA-Z_][a-zA-Z0-9_]*$') { throw 'Usuario PostgreSQL invalido.' }
        Write-Host 'A senha sera usada na configuracao do container, sem ser salva em arquivo do projeto.'
        Write-DockerState 'awaiting_password' 'Digite a senha atual do PostgreSQL somente nesta janela.'
        $securePassword = Read-Host 'Senha atual do PostgreSQL' -AsSecureString
        if ($securePassword.Length -eq 0) { throw 'A senha nao pode ficar vazia.' }
        $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
        try {
            $env:DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
        } finally {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
            $securePassword.Dispose()
        }
        $env:DB_URL = "jdbc:postgresql://${DatabaseHost}:${DatabasePort}/${DatabaseName}?sslmode=require"
        $env:DB_USERNAME = $DatabaseUser

        # Preserva a chave fornecida no ambiente. Caso ausente, cria uma chave
        # local estavel, excluida do Git e do contexto das imagens.
        if ([string]::IsNullOrWhiteSpace($env:JWT_SECRET)) {
            $keyFile = Join-Path $frontendRoot '.docker-jwt-secret.local'
            if (Test-Path -LiteralPath $keyFile) {
                $env:JWT_SECRET = [IO.File]::ReadAllText($keyFile).Trim()
            } else {
                $keyBytes = New-Object byte[] 32
                $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
                $rng.GetBytes($keyBytes)
                $rng.Dispose()
                $env:JWT_SECRET = [Convert]::ToBase64String($keyBytes)
                [IO.File]::WriteAllText($keyFile, $env:JWT_SECRET, [Text.UTF8Encoding]::new($false))
            }
        }
        if ([Text.Encoding]::UTF8.GetByteCount($env:JWT_SECRET) -lt 32) {
            throw 'JWT_SECRET precisa ter pelo menos 32 bytes.'
        }
    }

    Write-DockerState 'starting' 'Validando a configuracao e subindo os containers.'
    # --quiet evita imprimir a configuracao expandida com as credenciais.
    Invoke-Docker ($composeArguments + @('config', '--quiet'))
    $upArguments = $composeArguments + @('up', '-d', '--wait', '--wait-timeout', '180')
    if ($NoBuild) { $upArguments += '--no-build' } else { $upArguments += '--build' }
    Invoke-Docker $upArguments

    $page = Invoke-WebRequest -UseBasicParsing -Uri ($siteUrl + '/')
    if ($page.StatusCode -ne 200) { throw 'O frontend nao respondeu com HTTP 200.' }
    $apiStatus = 0
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri ($siteUrl + '/api/auth/me')
        $apiStatus = [int]$response.StatusCode
    } catch [System.Net.WebException] {
        if ($_.Exception.Response) {
            $apiStatus = [int]$_.Exception.Response.StatusCode
            $_.Exception.Response.Close()
        } else { throw }
    } catch {
        # PowerShell 7 usa HttpResponseException; Windows PowerShell usa WebException.
        if ($_.Exception.Response) { $apiStatus = [int]$_.Exception.Response.StatusCode } else { throw }
    }
    if ($apiStatus -ne 401) { throw "A API pelo proxy deveria responder 401 sem login; recebeu $apiStatus." }
    Write-DockerState 'success' 'Frontend e backend saudaveis; pagina 200 e API protegida 401.'
    Write-Host "Berxy disponivel em $siteUrl" -ForegroundColor Green
    if (-not $Local) { Write-Host 'Backend no perfil prod, usando PostgreSQL e validacao das tabelas existentes.' }
} catch {
    $scriptExit = 1
    Write-DockerState 'failed' $_.Exception.Message
    Write-Host $_.Exception.Message -ForegroundColor Red
} finally {
    foreach ($environmentName in $environmentNames) {
        [Environment]::SetEnvironmentVariable($environmentName, $previousEnvironment[$environmentName], 'Process')
    }
    Set-Location -LiteralPath $oldDirectory
}

if ($PauseWindow) { $null = Read-Host 'Pressione Enter para fechar esta janela' }
exit $scriptExit
