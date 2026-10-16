$pubKey = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINGHI1HpqXUdbHP27f/quzO1Q4e+0tfq73EmOgiIF6cH assetaudit-deploy@assetaudit.uz"
$oneLiner = "useradd -m -s /bin/bash deployer 2>/dev/null; usermod -aG sudo deployer; mkdir -p /home/deployer/.ssh && chmod 700 /home/deployer/.ssh && echo '$pubKey' > /home/deployer/.ssh/authorized_keys && chmod 600 /home/deployer/.ssh/authorized_keys && chown -R deployer:deployer /home/deployer/.ssh; passwd deployer"

Set-Clipboard -Value $oneLiner
Write-Host "=================================================================="
Write-Host "  MUVAFFAQIYATLI! VPS Bootstrap buyrug'i clipboardga nusxalandi!"
Write-Host "=================================================================="
Write-Host ""
Write-Host "Endi VNC terminaliga o'tib, sichqonchaning o'ng tugmasi yoki Paste qiling."
Write-Host ""

