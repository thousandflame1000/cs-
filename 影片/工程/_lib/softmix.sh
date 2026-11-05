#!/usr/bin/env bash
# 柔和混音（學生回饋：低音底噪、高聲的「叮」看了不舒服）
# 不放底樂 bed；chime −10 dB、impact/thump/riser −5 dB；整條再切掉 90 Hz 以下的低頻和 6.5 kHz 以上的尖銳高頻
# 用法：softmix.sh cues.json sfx目錄 長度 輸出.wav [lufs]
set -e
SK="${LKA_SCRIPTS:-$(cd "$(dirname "$0")/.." && pwd)/_toolkit/lead-knowledge-animation/scripts}"
CUES="$1"; SFX="$2"; DUR="$3"; OUT="$4"; LUFS="${5:--16}"
python3 - "$CUES" <<'PY'
import json, sys
p = sys.argv[1]; d = json.load(open(p, encoding='utf-8'))
soft = {'chime': -10, 'impact': -5, 'thump': -5, 'riser': -5, 'glitch': -3}
for c in d.get('cues', []):
    if c.get('sfx') in soft: c['gain'] = c.get('gain', -10) + soft[c['sfx']]
json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False)
PY
python3 $SK/mix.py --cues "$CUES" --sfx-dir "$SFX" --duration "$DUR" --out "${OUT%.wav}_raw.wav" --lufs "$LUFS" --tp -2 | tail -1
ffmpeg -y -v error -i "${OUT%.wav}_raw.wav" -af "highpass=f=90,lowpass=f=6500,loudnorm=I=${LUFS}:TP=-2:LRA=9" -ar 48000 "$OUT"
rm -f "${OUT%.wav}_raw.wav"
