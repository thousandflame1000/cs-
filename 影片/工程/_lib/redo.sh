#!/usr/bin/env bash
# 低優先重渲：主佇列全部交付、沒有片在渲染時，才把 REDO 清單裡的片重跑一次 finish.sh，
# 然後刪掉 .palace_done 讓 spliceall 重新剪接、重新轉網頁版。做完的片留 .redo_<TAG> 戳記。
# 用法：REDO_TAG=tag150 bash _lib/redo.sh 01 02 03 ...
cd "$(dirname "$0")/.."
ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
TAG="${REDO_TAG:-redo}"
gitsave() {
  [ "${AUTO_GIT:-0}" = 1 ] || return 0
  local LOCK=""; command -v flock >/dev/null && LOCK="flock /tmp/cs-git.lock"
  ( cd "$ROOT" && $LOCK bash -c "$1" )
}
pending() { while IFS='|' read -r P N HD; do [ -z "$P" ] && continue; [ -f "../新版短影音/$N.mp4" ] && [ -f "../新版短影音/${N}_封面_直版4K.png" ] || { echo "$P"; return; }; done < _lib/queue.txt; }
for ID in "$@"; do
  LINE=$(grep "^$ID-" _lib/queue.txt | head -1); [ -z "$LINE" ] && { echo "!!! $ID 不在 queue"; continue; }
  IFS='|' read -r P N HD <<< "$LINE"
  [ -f "$P/out/.redo_$TAG" ] && continue
  while [ -n "$(pending)" ] || pgrep -f "_lib/finish.sh" >/dev/null; do sleep 60; done
  echo "=== $(date +%T) 重渲 $P"
  bash _lib/finish.sh "$P" "$N" "$HD" > "$P/out/finish.log" 2>&1 || { echo "!!! $P 失敗"; tail -5 "$P/out/finish.log"; continue; }
  touch "$P/out/.redo_$TAG"; rm -f "$P/out/.palace_done"
  echo "=== $(date +%T) 完成 $P"
  gitsave "git add '影片/工程/$P' '影片/新版短影音' && git commit -q -m 'Re-render $N (chapter tag moved above counters)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01UihNWhNPhb1ZaavFZoaZ44' && for i in 1 2 3 4; do git push -q && break || sleep \$((2**i)); done" || echo "!!! commit/push 失敗"
done
echo "=== $(date +%T) 重渲清單完成"
