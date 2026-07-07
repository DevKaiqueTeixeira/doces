param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$FlywayArgs
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$flywayPath = Join-Path $repoRoot '.tools\flyway-12.10.0\flyway.cmd'
$configPath = Join-Path $repoRoot 'flyway\conf\flyway.local.conf'
$normalizedRepoRoot = $repoRoot -replace '\\', '/'

if (-not (Test-Path $flywayPath)) {
  throw "Flyway nao encontrado em $flywayPath"
}

$versionOnly = $FlywayArgs.Count -gt 0 -and (
  $FlywayArgs[0] -eq 'version' -or
  $FlywayArgs[0] -eq '--version'
)

if ($versionOnly) {
  & $flywayPath "-locations=filesystem:$normalizedRepoRoot/flyway/sql" @FlywayArgs
  exit $LASTEXITCODE
}

if (-not (Test-Path $configPath)) {
  throw "Arquivo de configuracao nao encontrado: $configPath"
}

& $flywayPath "-configFiles=$configPath" @FlywayArgs
exit $LASTEXITCODE
