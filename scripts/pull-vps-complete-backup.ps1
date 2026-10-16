# ==============================================================================
# AssetAudit — VPS dan Favqulodda Zaxirani Mahalliy Kompyuterga Yuklash (Offsite)
# ==============================================================================
param (
    [string]$VpsHost = "$VpsHost",
    [string]$VpsUser = "root",
    [string]$RemoteDir = "/root/vps_emergency_backups",
    [string]$LocalDir = "backups\vps_emergency_backups"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $LocalDir)) {
    New-Item -ItemType Directory -Path $LocalDir -Force | Out-Null
}

Write-Host "======================================================================"
Write-Host "  ASSETAUDIT — OFFSITE ZAXIRANI YUKLAB OLISH"
Write-Host "  Server: ${VpsUser}@${VpsHost}"
Write-Host "  Mahalliy jild: ${LocalDir}"
Write-Host "======================================================================"
Write-Host ""

$scpCmd = Get-Command "scp" -ErrorAction SilentlyContinue
if (-not $scpCmd) {
    Write-Error "scp utilitasi tizimda topilmadi."
}

Write-Host "[1/3] Serverdagi eng so'nggi zaxira arxivi yuklab olinmoqda..."
& scp "${VpsUser}@${VpsHost}:${RemoteDir}/vps_complete_backup_latest.tar.gz" "${LocalDir}\"
& scp "${VpsUser}@${VpsHost}:${RemoteDir}/vps_complete_backup_latest.tar.gz.sha256" "${LocalDir}\"

$DownloadedFile = Join-Path $LocalDir "vps_complete_backup_latest.tar.gz"
$ShaFile = Join-Path $LocalDir "vps_complete_backup_latest.tar.gz.sha256"

if (-not (Test-Path $DownloadedFile)) {
    Write-Error "Zaxira fayli yuklab olinmadi: $DownloadedFile"
}

Write-Host "[2/3] SHA-256 yaxlitlik tekshiruvi bajarilmoqda..."
$LocalHash = (Get-FileHash -Path $DownloadedFile -Algorithm SHA256).Hash.ToLower()
$ExpectedHash = (Get-Content -Path $ShaFile).Trim().Split(" ")[0].ToLower()

Write-Host "  -> Mahalliy hisoblangan SHA-256: $LocalHash"
Write-Host "  -> Serverda hisoblangan SHA-256: $ExpectedHash"

if ($LocalHash -eq $ExpectedHash) {
    Write-Host ""
    Write-Host "======================================================================"
    Write-Host "OFFAYT ZAXIRASI 100% YAXLIT VA MUVAFFAQIYATLI SAQLANDI!"
    Write-Host "Fayl joylashuvi: $DownloadedFile"
    Write-Host "======================================================================"
} else {
    Write-Error "XAVFSIZLIK XATOSI: SHA-256 xeshlari mos kelmadi! Fayl buzilgan bo'lishi mumkin."
}
