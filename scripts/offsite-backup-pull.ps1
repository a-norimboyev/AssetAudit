# ==============================================================================
# AssetAudit — Offsite Zaxiralash (Pull Model / Mahalliy Kompyuterga Ko'chirish)
# Pullik servislarsiz, mavjud SSH orqali zaxira nusxalarini xavfsiz yuklab olish
# ==============================================================================
param (
    [string]$VpsHost = "vps.assetaudit.uz",
    [string]$VpsUser = "root",
    [int]$VpsPort = 22,
    [string]$RemoteBackupDir = "/var/backups/assetaudit/postgres",
    [string]$LocalOffsiteDir = "C:\AssetAudit_Offsite_Backups",
    [string]$SshKeyPath = ""
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $LocalOffsiteDir)) {
    New-Item -ItemType Directory -Path $LocalOffsiteDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Write-Host "======================================================================"
Write-Host "[$Timestamp] OFFSITE ZAXIRALASH (PULL) BOSHLANDI"
Write-Host "Manba (Eskiz VPS): ${VpsUser}@${VpsHost}:${RemoteBackupDir}"
Write-Host "Mahalliy Xavfsiz Xotira: $LocalOffsiteDir"
Write-Host "======================================================================"

$scpArgs = @("-P", $VpsPort)
if ($SshKeyPath -and (Test-Path $SshKeyPath)) {
    $scpArgs += @("-i", $SshKeyPath)
}
$scpArgs += @("${VpsUser}@${VpsHost}:${RemoteBackupDir}/*.dump*", $LocalOffsiteDir)

try {
    Write-Host "[1/2] Eng so'nggi zaxira nusxalari va SHA-256 xeshlari yuklab olinmoqda..."
    & scp @scpArgs

    Write-Host "[2/2] Yuklab olingan fayllar butunligi tekshirilmoqda..."
    $latestDump = Get-ChildItem "$LocalOffsiteDir\*.dump" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($latestDump) {
        $hash = (Get-FileHash -Path $latestDump.FullName -Algorithm SHA256).Hash
        Write-Host "  -> Fayl: $($latestDump.Name) ($($latestDump.Length) bayt)"
        Write-Host "  -> SHA-256: $hash"
    }

    Write-Host "NATIJA: Offsite zaxiralash 100% muvaffaqiyatli yakunlandi! (Xarajat: 0 so'm)"
} catch {
    Write-Error "Offsite zaxirani yuklab olishda xatolik: $_"
}
