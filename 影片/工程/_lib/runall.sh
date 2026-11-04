#!/usr/bin/env bash
# 依 _lib/queue.txt 依序收尾（可斷點續跑：已交付的跳過）；每支完成就 git commit + push
# queue.txt 每行：工程資料夾|成片名稱|holds
cd "$(dirname "$0")/.."
while true; do
  LINE=$(while IFS='|' read -r P N HD; do [ -z "$P" ] && continue; [ -f "../新版短影音/$N.mp4" ] && [ -f "../新版短影音/${N}_封面_直版4K.png" ] && continue; echo "$P|$N|$HD"; break; done < _lib/queue.txt)
  [ -z "$LINE" ] && { sleep 30; continue; }
  IFS='|' read -r P N HD <<< "$LINE"
  echo "=== $(date +%T) 開始 $P"
  bash _lib/finish.sh "$P" "$N" "$HD" > "$P/out/finish.log" 2>&1 || { echo "!!! $P 失敗"; tail -5 "$P/out/finish.log"; sleep 60; continue; }
  echo "=== $(date +%T) 完成 $P"; tail -8 "$P/out/finish.log"
  ( cd /home/user/cs- && flock /tmp/cs-git.lock bash -c "git add '影片/工程/$P' '影片/新版短影音' && git commit -q -m 'Add remade short video $N

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01UihNWhNPhb1ZaavFZoaZ44' && for i in 1 2 3 4; do git push -q && break || sleep \$((2**i)); done" ) || echo "!!! commit/push 失敗"
done
