#!/usr/bin/env bash
# 依序收尾：等前一支 finish 結束再跑下一支（避免 4 核 CPU 互搶）
# 用法：bash _lib/queue.sh <前一支 log> <工程資料夾> "<成片名稱>" [holds]
set -u
PREV="$1"; shift
while [ -n "$PREV" ] && ! grep -qE "交付 →|Error|error|Traceback" "$PREV" 2>/dev/null; do sleep 15; done
bash _lib/finish.sh "$@"
