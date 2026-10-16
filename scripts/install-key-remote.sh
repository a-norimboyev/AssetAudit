#!/bin/bash
mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINGHI1HpqXUdbHP27f/quzO1Q4e+0tfq73EmOgiIF6cH assetaudit-deploy@assetaudit.uz" > "$HOME/.ssh/authorized_keys"
chmod 600 "$HOME/.ssh/authorized_keys"
echo "KEY_INSTALLED_SUCCESSFULLY"

