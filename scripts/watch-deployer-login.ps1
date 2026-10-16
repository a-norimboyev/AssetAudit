$VpsHost = if ($env:VPS_HOST) { $env:VPS_HOST } else { "127.0.0.1" }
# ==============================================================================
# AssetAudit — Deployer SSH Loginini Avtomatlashtirilgan Kutish va Diagnostika
# ==============================================================================
Write-Host "======================================================================"
Write-Host "  ASSETAUDIT: DEPLOYER SSH ULANISHINI KUTISH VA TEKSHIRISH"
Write-Host "  Target: deployer@$VpsHost"
Write-Host "======================================================================"
Write-Host ""
Write-Host "Serverda deployer SSH kaliti faollashishi kutilmoqda (har 3 soniyada tekshiriladi)..."

$maxAttempts = 100
$attempt = 0
$sshKey = "$HOME\.ssh\id_ed25519"

while ($attempt -lt $maxAttempts) {
    $attempt++
    $testResult = & ssh -i $sshKey -o BatchMode=yes -o ConnectTimeout=3 deployer@$VpsHost "echo DEPLOYER_READY" 2>$null

    if ($testResult -match "DEPLOYER_READY") {
        Write-Host ""
        Write-Host "======================================================================"
        Write-Host "MUVAFFAQIYAT! deployer SSH LOGIN 100% ISHLAMOQDA (STATUS: PASS)!"
        Write-Host "======================================================================"
        Write-Host ""
        Write-Host "Serverda avtomatik READ-ONLY diagnostika boshlanmoqda..."
        Write-Host ""
        Get-Content -Path "scripts\vps-read-only-check.sh" -Raw | & ssh -i $sshKey deployer@$VpsHost "bash -s"
        exit 0
    }

    Write-Host -NoNewline "."
    Start-Sleep -Seconds 3
}

Write-Host ""
Write-Host "Kutish vaqti tugadi (Timeout). Deployer hali faollashtirilmadi."
exit 1
