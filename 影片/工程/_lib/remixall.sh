#!/usr/bin/env bash
# 把已交付影片換成柔和混音（softmix.sh），畫面不重渲（-c:v copy），再讓 spliceall 重剪宮殿片頭片尾
cd "$(dirname "$0")/.."; LIB="$(pwd)/_lib"; SK="$(pwd)/_toolkit/lead-knowledge-animation/scripts"
while IFS='|' read -r P N HD; do
  [ -z "$P" ] && continue; [ -f "$P/out/.soft" ] && continue; [ -f "$P/out/$N.mp4" ] || continue
  ( cd "$P" && DUR=$(python3 -c "import json;s=open('film/timing.js',encoding='utf-8').read();print(json.loads(s[s.index('{'):s.index(';\n')])['total'])") && \
    node $SK/cues.mjs film/index.html > work/cues.json && bash "$LIB/softmix.sh" work/cues.json work/sfx $DUR work/mix.wav -16 > /dev/null && \
    nice -n 10 ffmpeg -y -v error -i "out/$N.mp4" -i work/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 160k -shortest "out/$N.soft.mp4" && \
    mv "out/$N.soft.mp4" "out/$N.mp4" && cp "out/$N.mp4" "../../新版短影音/" && touch out/.soft && rm -f out/.palace_done && echo "$(date +%T) 換音 $P" ) || echo "!!! $P 換音失敗"
done < _lib/queue.txt
echo "$(date +%T) 換音完成"
