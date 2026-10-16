@echo off
title ASSETAUDIT - TATU ADMIN ONBOARDING
cd /d "c:\Users\user\OneDrive\Desktop\AssetAudit"
echo ==================================================================
echo   ASSETAUDIT: TATU ADMINISTRATORINI YARATISH
echo ==================================================================
call npx tsx scripts/create-organization-admin.ts --execute --org-code TATU --login tatu.admin --name "TATU Administrator" --auto-password
echo.
echo ==================================================================
echo   DIQQAT: Yuqoridagi vaqtinchalik parolni saqlab oling.
echo   Shundan song ushbu oynani yopishingiz mumkin.
echo ==================================================================
pause
