#!/usr/bin/env bash
# 背景迴圈：凡是已交付、還沒剪進記憶宮殿的成片，就剪接並 commit + push
cd "$(dirname "$0")/.."
ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
gitsave() {  # AUTO_GIT=1 才自動 commit + push（雲端工作階段用）；本機預設不動 git
  [ "${AUTO_GIT:-0}" = 1 ] || return 0
  local LOCK=""; command -v flock >/dev/null && LOCK="flock /tmp/cs-git.lock"
  ( cd "$ROOT" && $LOCK bash -c "$1" )
}
while true; do
  did=0
  for P in [0-9][0-9]-*; do
    [ -f "$P/out/.palace_done" ] && continue
    N=$(ls "$P/out/" 2>/dev/null | grep -E '^[0-9]{2}-.*\.mp4$' | grep -v '_palace' | head -1); N="${N%.mp4}"
    [ -z "$N" ] && continue
    [ -f "../新版短影音/$N.mp4" ] && [ -f "../新版短影音/${N}_封面_直版4K.png" ] || continue
    echo "=== $(date +%T) 宮殿剪接 $P"
    bash _lib/splice.sh "$P" "$N" 2>&1 | tail -2 || { echo "!!! $P 剪接失敗"; continue; }
    bash _lib/webenc.sh "${P%%-*}" 2>&1 | tail -2
    gitsave "git add '影片/新版短影音' '影片/工程/_palace' '影片/工程/_lib' web/media && git commit -q -m 'Splice memory-palace intro/outro into $N

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01UihNWhNPhb1ZaavFZoaZ44' && for i in 1 2 3 4; do git push -q && break || sleep \$((2**i)); done" || echo "!!! commit/push 失敗"
    did=1
  done
  [ $did = 0 ] && sleep 60
done
