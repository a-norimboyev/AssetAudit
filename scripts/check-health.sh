#!/usr/bin/env bash
# ==============================================================================
# AssetAudit — Server Monitoring va Health Check Skripti (Linux VPS)
# API holati, PostgreSQL, Systemd xizmatlari va disk to'lishini tekshirish
# ==============================================================================
set -euo pipefail

ENDPOINT="${HEALTH_URL:-http://127.0.0.1:3000/api/health}"
DISK_ALERT_THRESHOLD=85
DISK_CRITICAL_THRESHOLD=95
LOG_FILE="/var/log/assetaudit/health_monitor.log"

mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true

log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$msg"
    if [ -w "$(dirname "$LOG_FILE")" ]; then
        echo "$msg" >> "$LOG_FILE" 2>/dev/null || true
    fi
}

log "=== Health Monitoring Tekshiruvi Boshlandi ==="

# 1. API Health Check tekshiruvi
log "[1/4] Next.js API /api/health tekshirilmoqda (${ENDPOINT})..."
HTTP_CODE=$(curl -s -o /tmp/health_resp.json -w "%{http_code}" --max-time 5 "${ENDPOINT}" || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    DB_STATUS=$(grep -o '"status":"[^"]*"' /tmp/health_resp.json | head -n 1 | cut -d'"' -f4 || echo "unknown")
    UPTIME=$(grep -o '"uptimeSec":[0-9]*' /tmp/health_resp.json | cut -d':' -f2 || echo "0")
    log "  -> API status: 200 OK | Tizim: ${DB_STATUS} | Uptime: ${UPTIME}s"
else
    log "  -> [XATO] API javob bermadi! HTTP kod: ${HTTP_CODE}"
    cat /tmp/health_resp.json 2>/dev/null || true
fi

# 2. Disk bandligi tekshiruvi (Disk Space Alert)
log "[2/4] Asosiy disk bandligi tekshirilmoqda..."
DISK_USAGE=$(df -P / | tail -n 1 | awk '{print $5}' | tr -d '%')
log "  -> Asosiy disk bandligi: ${DISK_USAGE}%"

if [ "$DISK_USAGE" -ge "$DISK_CRITICAL_THRESHOLD" ]; then
    log "  -> [KRITIK OGOHLANTIRISH] Disk deyarli to'lgan (${DISK_USAGE}%)! Zudlik bilan tozalash talab etiladi!"
elif [ "$DISK_USAGE" -ge "$DISK_ALERT_THRESHOLD" ]; then
    log "  -> [OGOHLANTIRISH] Disk bandligi chegaradan oshdi (${DISK_USAGE}% >= ${DISK_ALERT_THRESHOLD}%)!"
else
    log "  -> Disk holati: Yaxshi."
fi

# 3. Systemd Xizmatlari tekshiruvi
log "[3/4] Tizim xizmatlari faolligi tekshirilmoqda..."
if command -v systemctl >/dev/null 2>&1; then
    for SVC in assetaudit nginx postgresql; do
        if systemctl is-active --quiet "$SVC"; then
            log "  -> Xizmat ${SVC}: ACTIVE (Ishlamoqda)"
        else
            log "  -> [XATO] Xizmat ${SVC}: INACTIVE / FAILED!"
        fi
    done
fi

# 4. RAM va Swap xotira sarfi
log "[4/4] Operativ xotira (RAM) sarfi:"
free -m | while read -r line; do
    log "  $line"
done

log "=== Monitoring Yakunlandi ==="
