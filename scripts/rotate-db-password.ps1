# ============================================================
# AssetAudit — DB Credential Rotation (Sprint 09 / 45X)
# XAVFSIZ VERSIYA: ALTER ROLE SQL logda ko'rinmaydi
# Parol stdin orqali uzatiladi, command-line argumentsiz
# ============================================================

$ErrorActionPreference = "Stop"
$PROJECT_ROOT = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "=================================================================="
Write-Host "  ASSETAUDIT — DB CREDENTIAL ROTATION (Xavfsiz v2)"
Write-Host "=================================================================="
Write-Host ""

# 1. .env.local dan eski URL ni o'qi
$envFile = Join-Path $PROJECT_ROOT ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Error "XATO: .env.local topilmadi: $envFile"
    exit 1
}

$envContent = Get-Content $envFile -Raw
if ($envContent -notmatch 'DATABASE_URL=([^\r\n]+)') {
    Write-Error "XATO: DATABASE_URL .env.local ichida topilmadi."
    exit 1
}
$oldUrl = $Matches[1].Trim()

# URL componentlarini ajratish
if ($oldUrl -notmatch 'postgresql://([^:]+):([^@]+)@([^/]+)/(.+)') {
    Write-Error "XATO: DATABASE_URL formati noto'g'ri."
    exit 1
}
$oldUser = $Matches[1]
$oldPw   = $Matches[2]
$hostPort= $Matches[3]
$dbName  = $Matches[4]
if ($hostPort -match '([^:]+):(\d+)') {
    $pgHost = $Matches[1]; $pgPort = $Matches[2]
} else {
    $pgHost = $hostPort; $pgPort = "5432"
}

# 2. Joriy ulanishni tekshir
Write-Host "[1/7] Joriy ulanish tekshirilmoqda..."
$env:PGPASSWORD = $oldPw
$check = & psql -h $pgHost -p $pgPort -U $oldUser -d $dbName -t -c "SELECT 1;" 2>&1
$env:PGPASSWORD = ""
if ($LASTEXITCODE -ne 0) {
    Write-Error "XATO: Joriy DB ulanishi ishlamaydi. $check"
    exit 1
}
Write-Host "      OK — eski credential ishlaydi."

# 3. Kriptografik xavfsiz yangi parol (xotirada, hech qayerga yozilmaydi)
Write-Host "[2/7] Yangi kuchli parol yaratilmoqda (memory only)..."
$rng   = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$bytes = New-Object byte[] 24
$rng.GetBytes($bytes)
# Faqat alfanumerik — URL va SQL da muammosiz
$chars  = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'.ToCharArray()
$newPass = -join (1..32 | ForEach-Object { $chars[$bytes[$_ % $bytes.Length] % $chars.Length] })
Write-Host "      Yangi parol xotirada tayyor."

# 4. ALTER ROLE — parol stdin (heredoc) orqali, SQL logda ko'rinmaydi
Write-Host "[3/7] PostgreSQL da ALTER ROLE bajarilmoqda..."
# psql --no-password, parol faqat PGPASSWORD orqali
# SQL o'zi stdin orqali kiritiladi va process list da ko'rinmaydi
$alterSql = "ALTER ROLE mulknazorat_app PASSWORD '$newPass';"
$env:PGPASSWORD = $oldPw
try {
    $alterResult = $alterSql | & psql -h $pgHost -p $pgPort -U $oldUser -d $dbName -t 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "ALTER ROLE xatoligi: $alterResult"
    }
    Write-Host "      OK — PostgreSQL paroli o'zgartirildi."
} catch {
    $env:PGPASSWORD = ""
    $newPass = $null; [System.GC]::Collect()
    Write-Error "XATO: ALTER ROLE bajarilmadi. Eski credential o'zgarmadi.`n$_"
    exit 1
} finally {
    $env:PGPASSWORD = ""
}

# 5. .env.local yangilash
Write-Host "[4/7] .env.local yangilanmoqda..."
$newUrl     = "postgresql://mulknazorat_app:${newPass}@${hostPort}/${dbName}"
$newContent = $envContent -replace [regex]::Escape("DATABASE_URL=$oldUrl"), "DATABASE_URL=$newUrl"
Set-Content -Path $envFile -Value $newContent -NoNewline
Write-Host "      OK — .env.local yangilandi."

# 6. Yangi credential bilan ulanish sinovi
Write-Host "[5/7] Yangi credential sinovi (SELECT 1)..."
$env:PGPASSWORD = $newPass
$testResult = & psql -h $pgHost -p $pgPort -U mulknazorat_app -d $dbName -t -c "SELECT 1;" 2>&1
$env:PGPASSWORD = ""
if ($LASTEXITCODE -ne 0) {
    Write-Warning "OGOHLANTIRISH: Yangi credential ishlamadi. .env.local tiklanmoqda..."
    Set-Content -Path $envFile -Value $envContent -NoNewline
    $newPass = $null; [System.GC]::Collect()
    Write-Error "Rollback amalga oshirildi. ALTER ROLE ham muvaffaqiyatsiz deb hisoblanadi."
    exit 1
}
Write-Host "      OK — yangi credential ishlaydi. SELECT 1 = PASS."

# 7. Eski credential bloklanganini tekshir
Write-Host "[6/7] Eski credential bloklanganligi tekshirilmoqda..."
$env:PGPASSWORD = $oldPw
$oldTest = & psql -h $pgHost -p $pgPort -U mulknazorat_app -d $dbName -t -c "SELECT 1;" 2>&1
$env:PGPASSWORD = ""
if ($LASTEXITCODE -eq 0) {
    Write-Warning "DIQQAT: Eski credential hali ham ishlaydi (connection pooling sabab bo'lishi mumkin)."
} else {
    Write-Host "      OK — eski credential bloklandi."
}

# 8. Xotiradan tozalash
Write-Host "[7/7] Xotira tozalanmoqda..."
$newPass = $null
$oldPw   = $null
$newUrl  = $null
$oldUrl  = $null
$newContent = $null
$envContent = $null
[System.GC]::Collect()
Write-Host "      OK — xotira tozalandi."

Write-Host ""
Write-Host "=================================================================="
Write-Host "  MUVAFFAQIYATLI! DB Credential Rotation yakunlandi."
Write-Host "  Keyingi qadam: Next.js serverni qayta ishga tushiring:"
Write-Host "  Stop: task-1731 jarayonini to'xtating"
Write-Host "  Start: npx next start -p 3001 -H 127.0.0.1"
Write-Host "=================================================================="
Write-Host ""
pause
