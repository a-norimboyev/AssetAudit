$VpsHost = if ($env:VPS_HOST) { $env:VPS_HOST } else { "127.0.0.1" }
# ==============================================================================
# AssetAudit: Deployer SSH Key Installation & Diagnostics
# ==============================================================================
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "ASSETAUDIT — DEPLOYER SSH KEY SETUP"

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  ASSETAUDIT: VPS DEPLOYER KALIT O'RNATISH VA DIAGNOSTIKA" -ForegroundColor Cyan
Write-Host "  Target: deployer@$VpsHost" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "QOIDALAR:" -ForegroundColor Yellow
Write-Host "1. Siz VNC orqali yaratgan 'deployer' parolini quyida bir marta kiriting."
Write-Host "2. Tizim avtomatik ravishda Windows Ed25519 public keyini o'rnatadi."
Write-Host "3. Kalit o'rnatilgach, parolsiz SSH key ulanishini sinab ko'radi."
Write-Host "4. So'ngra serverning to'liq READ-ONLY diagnostikasini chiqaradi."
Write-Host ""
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "Iltimos, 'deployer' parolini kiriting:" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host ""

$pubKey = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINGHI1HpqXUdbHP27f/quzO1Q4e+0tfq73EmOgiIF6cH assetaudit-deploy@assetaudit.uz"
$remoteCmd = "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$pubKey' > ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo DEPLOYER_KEY_INSTALLED_SUCCESSFULLY"

ssh -o StrictHostKeyChecking=yes deployer@$VpsHost $remoteCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "==================================================================" -ForegroundColor Red
    Write-Host "[XATOLIK] Ulanish amalga oshmadi yoki parol noto'g'ri kiritildi." -ForegroundColor Red
    Write-Host "Qaytadan urinib ko'ring." -ForegroundColor Red
    Write-Host "==================================================================" -ForegroundColor Red
    Write-Host "Chiqish uchun istalgan tugmani bosing..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "[TEKSHIRUV] Yangi Ed25519 parolsiz SSH kaliti sinovdan o'tkazilmoqda..." -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

$keyPath = "$env:USERPROFILE\.ssh\id_ed25519"
$testOutput = & ssh -i $keyPath -o BatchMode=yes -o ConnectTimeout=5 deployer@$VpsHost "echo PUBLICKEY_AUTH_PASS" 2>&1

if ($LASTEXITCODE -eq 0 -and $testOutput -match "PUBLICKEY_AUTH_PASS") {
    Write-Host ""
    Write-Host "==================================================================" -ForegroundColor Green
    Write-Host "  STATUS: PASS!" -ForegroundColor Green
    Write-Host "  Ed25519 SSH KALITI 100% ISHLAMOQDA! PAROLSIZ ULANISH O'RNATILDI." -ForegroundColor Green
    Write-Host "==================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Serverning to'liq READ-ONLY diagnostikasi ishga tushirilmoqda..." -ForegroundColor Yellow
    Write-Host ""
    
    $diagScript = Join-Path $PSScriptRoot "vps-read-only-check.sh"
    $diagOut = Join-Path $PSScriptRoot "vps_diagnostics_latest.txt"
    
    Get-Content $diagScript | ssh -i $keyPath deployer@$VpsHost "bash -s" | Tee-Object -FilePath $diagOut
    
    Write-Host ""
    Write-Host "==================================================================" -ForegroundColor Green
    Write-Host "  DIAGNOSTIKA YAKUNLANDI!" -ForegroundColor Green
    Write-Host "  Natija '$diagOut' fayliga saqlandi." -ForegroundColor Green
    Write-Host "==================================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "==================================================================" -ForegroundColor Red
    Write-Host "  STATUS: BLOCKED" -ForegroundColor Red
    Write-Host "  Kalit o'rnatildi, ammo parolsiz handshake rad etildi." -ForegroundColor Red
    Write-Host "  Tafsilot: $testOutput" -ForegroundColor Red
    Write-Host "==================================================================" -ForegroundColor Red
}

Write-Host ""
Write-Host "Davom etish uchun istalgan tugmani bosing..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

