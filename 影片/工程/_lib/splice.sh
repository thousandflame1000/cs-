#!/usr/bin/env bash
# 把記憶宮殿片頭（片名卡之後）與片尾（考試卡之後）剪進成片，覆蓋 影片/新版短影音/<名稱>.mp4
# 用法：bash _lib/splice.sh <工程資料夾> "<成片名稱>"
set -euo pipefail
cd "$(dirname "$0")/.."
P="$1"; NAME="$2"; ID="${P:0:2}"
SK="${LKA_SCRIPTS:-$(cd "$(dirname "$0")/.." && pwd)/_toolkit/lead-knowledge-animation/scripts}"
RAW="$P/out/$NAME.mp4"; OUT="$P/out/${NAME}_palace.mp4"
[ -f "$RAW" ] || { echo "沒有成片 $RAW"; exit 1; }
SPLIT=$(python3 -c "import json;s=open('$P/film/timing.js',encoding='utf-8').read();d=json.loads(s[s.index('{'):s.index(';\n')]);L={l['id']:l for l in d['lines']};print(round(L['a1']['start']-0.02,3))")
for MODE in intro outro; do
  [ -s _palace/out/${ID}_$MODE.mp4 ] && [ _palace/out/${ID}_$MODE.mp4 -nt _palace/film/index.html ] && [ _palace/out/${ID}_$MODE.mp4 -nt _palace/film/palace.js ] && continue
  if [ "$MODE" = intro ]; then CUES='[{"t":0.2,"sfx":"whoosh","gain":-10},{"t":1.2,"sfx":"swish","gain":-12},{"t":2.3,"sfx":"chime","gain":-10}]'; else CUES='[{"t":0.4,"sfx":"whoosh","gain":-11},{"t":2.3,"sfx":"chime","gain":-10}]'; fi
  echo "$CUES" > _palace/work/${ID}_$MODE.json
  python3 $SK/mix.py --cues _palace/work/${ID}_$MODE.json --sfx-dir _palace/work/sfx --duration 3.0 --out _palace/work/${ID}_$MODE.wav --music _palace/work/sfx/bed.wav --music-db -16 --lufs -18 --tp -2 > /dev/null
  node $SK/render.mjs _palace/film/index.html --query "id=$ID&mode=$MODE" --out _palace/out/${ID}_$MODE.mp4 --fps 60 --scale 1 --workers 4 --crf 19 --audio _palace/work/${ID}_$MODE.wav | tail -1
done
ffmpeg -y -v error -t $SPLIT -i "$RAW" -i _palace/out/${ID}_intro.mp4 -ss $SPLIT -i "$RAW" -i _palace/out/${ID}_outro.mp4 -filter_complex \
"[0:a]aresample=48000[a0];[1:a]aresample=48000[a1];[2:a]aresample=48000[a2];[3:a]aresample=48000[a3];[0:v]setpts=PTS-STARTPTS[v0];[1:v]setpts=PTS-STARTPTS[v1];[2:v]setpts=PTS-STARTPTS[v2];[3:v]setpts=PTS-STARTPTS[v3];[v0][a0][v1][a1][v2][a2][v3][a3]concat=n=4:v=1:a=1[v][a]" \
-map "[v]" -map "[a]" -r 60 -c:v libx264 -preset medium -threads 2 -crf 19 -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -movflags +faststart -c:a aac -b:a 256k "$OUT"
cp "$OUT" "../新版短影音/$NAME.mp4"
touch "$P/out/.palace_done"
echo "宮殿剪接完成 → ../新版短影音/$NAME.mp4（$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT") s，切點 $SPLIT s）"
