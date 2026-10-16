# ==============================================================================
# AssetAudit — PostgreSQL Backup Skripti (PowerShell / Windows)
# ==============================================================================
param (
    [string]$Database = "mulknazorat_sprint05b_test",
    [string]$HostName = "127.0.0.1",
    [int]$Port = 5432,
    [string]$User = "postgres",
    [string]$BackupDir = "backups\postgres"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "db_${Database}_${Timestamp}.dump"

Write-Host "[$Timestamp] PostgreSQL zaxiralash boshlandi: $Database -> $BackupFile"

# pg_dump orqali eksport
$pgDump = Get-Command "pg_dump" -ErrorAction SilentlyContinue
if (-not $pgDump) {
    # Standart Windows PostgreSQL yo'llaridan qidirish
    $possiblePaths = @(
        "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe"
    )
    foreach ($p in $possiblePaths) {
        if (Test-Path $p) {
            $pgDump = $p
            break
        }
    }
}

if ($pgDump) {
    & $pgDump -h $HostName -p $Port -U $User -d $Database -F c -b -f $BackupFile
    $Hash = (Get-FileHash -Path $BackupFile -Algorithm SHA256).Hash
    "$Hash  $(Split-Path $BackupFile -Leaf)" | Out-File -FilePath "${BackupFile}.sha256" -Encoding ascii
    Write-Host "Zaxira muvaffaqiyatli saqlandi: $BackupFile (SHA-256: $Hash)"
} else {
    Write-Warning "pg_dump utilitasi PATH da topilmadi. PostgreSQL bin jildini tekshiring."
}
