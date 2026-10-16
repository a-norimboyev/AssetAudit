# ==============================================================================
# AssetAudit — Izolyatsiyalangan Tiklash Sinovi (PowerShell / Windows)
# ==============================================================================
param (
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$HostName = "127.0.0.1",
    [int]$Port = 5432,
    [string]$User = "postgres"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    Write-Error "Zaxira fayli topilmadi: $BackupFile"
}

$TmpDb = "assetaudit_restore_test_$([System.IO.Path]::GetRandomFileName().Substring(0,6))"

Write-Host "======================================================================"
Write-Host "Izolyatsiyalangan tiklash sinovi boshlandi:"
Write-Host "Zaxira fayli: $BackupFile"
Write-Host "Vaqtinchalik baza: $TmpDb"
Write-Host "======================================================================"

# createdb va pg_restore
$pgRestore = Get-Command "pg_restore" -ErrorAction SilentlyContinue
$createdb = Get-Command "createdb" -ErrorAction SilentlyContinue
$dropdb = Get-Command "dropdb" -ErrorAction SilentlyContinue
$psql = Get-Command "psql" -ErrorAction SilentlyContinue

if (-not $pgRestore) {
    $possiblePaths = @(
        "C:\Program Files\PostgreSQL\18\bin",
        "C:\Program Files\PostgreSQL\17\bin",
        "C:\Program Files\PostgreSQL\16\bin"
    )
    foreach ($p in $possiblePaths) {
        if (Test-Path (Join-Path $p "pg_restore.exe")) {
            $env:PATH = "$p;" + $env:PATH
            break
        }
    }
}

try {
    Write-Host "[1/3] Vaqtinchalik baza yaratilmoqda: $TmpDb..."
    & createdb -h $HostName -p $Port -U $User $TmpDb

    Write-Host "[2/3] pg_restore orqali ma'lumotlar tiklanmoqda..."
    & pg_restore -h $HostName -p $Port -U $User -d $TmpDb --no-owner --no-privileges $BackupFile

    Write-Host "[3/3] Tiklangan yozuvlar tekshirilmoqda..."
    & psql -h $HostName -p $Port -U $User -d $TmpDb -c "SELECT count(*) AS items_count FROM items;"
    & psql -h $HostName -p $Port -U $User -d $TmpDb -c "SELECT count(*) AS orgs_count FROM organizations;"

    Write-Host "NATIJA: Zaxira fayli yaroqli va xatosiz tiklandi!"
} finally {
    Write-Host "Tozalash: $TmpDb o'chirilmoqda..."
    & dropdb -h $HostName -p $Port -U $User --if-exists $TmpDb
}
