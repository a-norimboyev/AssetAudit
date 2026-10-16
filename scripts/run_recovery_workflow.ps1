$VpsHost = if ($env:VPS_HOST) { $env:VPS_HOST } else { "127.0.0.1" }
# ==============================================================================
# AssetAudit: Deployer SSH Key Setup, Password Rotation & Diagnostics
# ==============================================================================
$ErrorActionPreference = "Continue"

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  ASSETAUDIT: VPS SSH TIKLASH VA PAROL ROTATSIYASI" -ForegroundColor Cyan
Write-Host "  Server: $VpsHost (deployer)" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "QOIDALAR:" -ForegroundColor Yellow
Write-Host "1. VNC orqali o'rnatilgan joriy (eski) deployer parolini kiriting."
Write-Host "2. Windows Ed25519 kaliti serverga o'rnatiladi."
Write-Host "3. Kalit tekshirilgach, deployer va root parollarini yangilash boshlanadi."
Write-Host "4. So'ngra serverning to'liq READ-ONLY diagnostikasi bajariladi."
Write-Host ""
Write-Host "------------------------------------------------------------------"
Write-Host "[1/4] Iltimos, joriy 'deployer' parolini kiriting:" -ForegroundColor Green
Write-Host "------------------------------------------------------------------"

$pubKey = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINGHI1HpqXUdbHP27f/quzO1Q4e+0tfq73EmOgiIF6cH assetaudit-deploy@assetaudit.uz"
$cmdSetup = "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$pubKey' > ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo KEY_SETUP_DONE"

& ssh -o StrictHostKeyChecking=yes deployer@$VpsHost $cmdSetup

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[XATOLIK] Ulanish amalga oshmadi yoki parol noto'g'ri kiritildi." -ForegroundColor Red
    Write-Host "Qaytadan urinib ko'ring." -ForegroundColor Red
    return
}

Write-Host ""
Write-Host "[2/4] Parolsiz Ed25519 kalit ulanishi sinovdan o'tkazilmoqda..." -ForegroundColor Cyan
$keyPath = "$env:USERPROFILE\.ssh\id_ed25519"
$testRes = & ssh -i $keyPath -o BatchMode=yes -o ConnectTimeout=5 deployer@$VpsHost "echo KEY_AUTH_PASS" 2>&1

if ($LASTEXITCODE -eq 0 -and $testRes -match "KEY_AUTH_PASS") {
    Write-Host "  -> STATUS: PASS! Ed25519 SSH kaliti muvaffaqiyatli ishlamoqda!" -ForegroundColor Green
} else {
    Write-Host "  -> STATUS: BLOCKED! Kalit orqali parolsiz kirish rad etildi: $testRes" -ForegroundColor Red
    return
}

Write-Host ""
Write-Host "[3/4] Parollarni rotatsiya qilish boshlanmoqda..." -ForegroundColor Cyan
$rotateScript = Join-Path $PSScriptRoot "vps-rotate-passwords.sh"
& scp -i $keyPath $rotateScript deployer@$VpsHost:/tmp/vps-rotate-passwords.sh
& ssh -t -i $keyPath deployer@$VpsHost "bash /tmp/vps-rotate-passwords.sh; rm -f /tmp/vps-rotate-passwords.sh"

Write-Host ""
Write-Host "[4/4] READ-ONLY Preflight diagnostika bajarilmoqda..." -ForegroundColor Cyan
$diagScript = Join-Path $PSScriptRoot "vps-read-only-check.sh"
$diagOut = Join-Path $PSScriptRoot "vps_diagnostics_latest.txt"

Get-Content $diagScript | & ssh -i $keyPath deployer@$VpsHost "bash -s" | Tee-Object -FilePath $diagOut

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "  AMALIYOT YAKUNLANDI: BARCHA XAVFSIZLIK TEKSHIRUVLARI PASS!" -ForegroundColor Green
Write-Host "  Diagnostika fayli: $diagOut" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green

