#!/usr/bin/env bash
# 收尾：字體子集 → 音效 → 混音 → 成片渲染（已有就跳過）→ 體檢 → 封面 → 交付到 影片/新版短影音/
# 用法：bash _lib/finish.sh <工程資料夾> "<成片名稱>" [holds] [cuts]
set -euo pipefail
P="$1"; NAME="$2"; HOLDS="${3:-}"; CUTS="${4:-}"
SK="${LKA_SCRIPTS:-$(cd "$(dirname "$0")/.." && pwd)/_toolkit/lead-knowledge-animation/scripts}"
cd "$P"
cp ../_lib/cs.js film/cs.js 2>/dev/null || true
[ -f film/space.js ] && cp ../_lib/space.js film/space.js
python3 $SK/fonts.py film/ > /dev/null
[ -d work/sfx ] || python3 $SK/sfx.py --out work/sfx --variants 3 --bed 120 --bpm 84 --key A --mood calm > /dev/null
DUR=$(python3 -c "import json;s=open('film/timing.js',encoding='utf-8').read();print(json.loads(s[s.index('{'):s.index(';\n')])['total'])")
HAVE=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "out/$NAME.mp4" 2>/dev/null || echo 0)
if python3 -c "import sys; sys.exit(0 if float('${HAVE:-0}' or 0) >= $DUR - 0.5 else 1)"; then
  echo "成片已存在（$HAVE s），跳過渲染"
else
  node $SK/cues.mjs film/index.html > work/cues.json
  python3 $SK/mix.py --cues work/cues.json --sfx-dir work/sfx --duration $DUR --out work/mix.wav --music work/sfx/bed.wav --music-db -16 --lufs -16 --tp -2 | tail -1
  node $SK/render.mjs film/index.html --out "out/$NAME.mp4" --fps 60 --scale 1 --workers 4 --crf 19 --audio work/mix.wav | tail -1
fi
python3 $SK/qa_video.py "out/$NAME.mp4" --sheet out/final_sheet.png ${HOLDS:+--holds $HOLDS} ${CUTS:+--cuts $CUTS} | grep -E "!|✓|响度|·.*fps" || true
node $SK/cover.mjs film/cover.html --out out --name "$NAME" --guides | tail -2
D=../../新版短影音; mkdir -p $D
cp "out/$NAME.mp4" "$D/"
cp "out/${NAME}_封面_横版4K.png" "$D/${NAME}_封面_橫版4K.png"
cp "out/${NAME}_封面_竖版4K.png" "$D/${NAME}_封面_直版4K.png"
[ -f work/文案与封面.md ] && cp work/文案与封面.md "$D/${NAME}_文案與封面.md"
echo "交付 → $D/$NAME.mp4"
