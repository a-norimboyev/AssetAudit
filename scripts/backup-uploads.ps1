# ==============================================================================
# AssetAudit — Uploads Storage Backup Skripti (PowerShell / Windows)
# ==============================================================================
param (
    [string]$SourceDir = "public\uploads\inventory",
    [string]$BackupDir = "backups\uploads"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$ArchiveName = "assetaudit_uploads_${Timestamp}.zip"
$ArchivePath = Join-Path $BackupDir $ArchiveName

Write-Host "[$Timestamp] Uploads zaxiralash boshlandi: $SourceDir -> $ArchivePath"

if (Test-Path $SourceDir) {
    Compress-Archive -Path "$SourceDir\*" -DestinationPath $ArchivePath -Force
} else {
    Write-Warning "Manba jildi topilmadi: $SourceDir. Bo'sh arxiv yaratilmoqda."
    # Bo'sh arxiv yaratish
    $tempFile = [System.IO.Path]::GetTempFileName()
    Compress-Archive -Path $tempFile -DestinationPath $ArchivePath -Force
    Remove-Item $tempFile
}

$Hash = (Get-FileHash -Path $ArchivePath -Algorithm SHA256).Hash
"$Hash  $ArchiveName" | Out-File -FilePath "${ArchivePath}.sha256" -Encoding ascii

$Size = (Get-Item $ArchivePath).Length
Write-Host "[$Timestamp] Zaxira muvaffaqiyatli yakunlandi! Hajmi: $Size bayt"
Write-Host "[SHA-256]: $Hash"
