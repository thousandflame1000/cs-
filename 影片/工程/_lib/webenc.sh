#!/usr/bin/env bash
# 把交付的成片（已剪進記憶宮殿）壓成網站用的版本：web/media/<clip id>.mp4（540×960、30fps）＋ 海報 .jpg
# 用法：bash _lib/webenc.sh [NN ...]（不給就全部檢查；來源比較新才重壓）
cd "$(dirname "$0")/.."
WEB=/home/user/cs-/web/media; mkdir -p "$WEB"
IDS=(_ ds-heap al-master co-pipe os-srtf dm-pigeon la-eigen ds-avl al-dijkstra co-cache os-lru dm-venn la-proj dm-catalan dm-hasse dm-euclid la-systems os-process ds-amortized co-perf ds-sort la-vs co-arith os-sync la-det ds-hash co-datapath dm-recur-gf ds-btree os-deadlock ds-unionfind ds-graph os-memory al-dc co-ilp al-dp dm-graph al-greedy la-sym-svd os-storage al-mst-flow co-vm-coherence al-np al-prob)
LIST="$*"; [ -z "$LIST" ] && LIST=$(seq -w 1 43)
for NN in $LIST; do
  P=$(ls -d ${NN}-* 2>/dev/null | head -1); [ -n "$P" ] && [ -f "$P/out/.palace_done" ] || continue
  SRC=$(ls ../新版短影音/${NN}-*.mp4 2>/dev/null | head -1); [ -f "$SRC" ] || continue
  ID=${IDS[$((10#$NN))]}; OUT="$WEB/$ID.mp4"
  [ -f "$OUT" ] && [ "$OUT" -nt "$SRC" ] && continue
  echo "=== $(date +%T) 網頁版 $NN → media/$ID.mp4"
  nice -n 10 ffmpeg -v error -y -i "$SRC" -vf "fps=30,scale=540:960:flags=lanczos" -c:v libx264 -preset slow -crf 28 -profile:v high -pix_fmt yuv420p \
    -movflags +faststart -c:a aac -b:a 80k -threads 2 "$OUT.tmp.mp4" && mv "$OUT.tmp.mp4" "$OUT" || { echo "!!! $NN 壓縮失敗"; rm -f "$OUT.tmp.mp4"; continue; }
  nice -n 10 ffmpeg -v error -y -ss 6.2 -i "$SRC" -frames:v 1 -vf "scale=540:960:flags=lanczos" -q:v 4 "$WEB/$ID.jpg"
  echo "    $(du -h "$OUT" | cut -f1)"
done
