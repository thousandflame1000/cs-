# 影片工程：在自己電腦上改、自己渲染

43 支短影音的原始碼全在這裡。成片在 `../新版短影音/`，網站用的壓縮版在 `../../web/media/`。

## 需要裝的東西（一次）

| 工具 | 版本 | 用途 |
|---|---|---|
| Git Bash（Windows）或任何 bash | — | 跑 `_lib/*.sh` |
| Node.js | 20 以上 | 用瀏覽器逐幀畫面 |
| Playwright 的 Chromium | — | `npm i -g playwright && npx playwright install chromium` |
| ffmpeg | 6 以上，要在 PATH | 合成影片、混音 |
| Python | 3.10 以上 | `pip install -r _toolkit/lead-knowledge-animation/requirements.txt` |

字型第一次要下載（約 200 MB，不進 git）：

```bash
python _toolkit/lead-knowledge-animation/scripts/fonts.py --fetch
```

## 一支影片的檔案

```
NN-名稱/
  work/lines.json      字幕稿：每句的文字、停留秒數（改字幕從這裡改）
  film/index.html      動畫本體（瀏覽器打開就能預覽：空白鍵播放、←→ 逐幀）
  film/cover.html      封面
  film/timing.js       由 lines.json 產生，不要手改
  work/film.md         畫面設計與修改紀錄
  work/文案与封面.md   發布文案
```

## 常用指令（都在 `影片/工程/` 底下跑）

```bash
SK=_toolkit/lead-knowledge-animation/scripts

# 改了字幕稿 → 重算時間軸
python $SK/timeline.py NN-名稱/work/lines.json --film NN-名稱/film

# 看靜幀（每 2.5 秒一張，聯絡表在 NN-名稱/out/stills/）
node $SK/stills.mjs NN-名稱/film/index.html --every 2.5

# 檢查畫面是不是時間的純函數（渲染前必過）
node $SK/verify.mjs NN-名稱/film/index.html

# 完整收尾：字型子集 → 音效 → 混音 → 渲染 → 體檢 → 封面 → 複製到 新版短影音/
bash _lib/finish.sh NN-名稱 "NN-科目-片名" "考試卡開始秒數-總秒數"

# 剪進記憶宮殿的片頭片尾
bash _lib/splice.sh NN-名稱 "NN-科目-片名"

# 壓成網站用的 540p 版本
bash _lib/webenc.sh NN

# 一次跑完佇列（_lib/queue.txt 每行：資料夾|成片名稱|考試卡秒數）
bash _lib/runall.sh

# 改了共用程式（例如 cs.js）後，把已交付的片重渲一輪（佇列空了才跑，做完的留 out/.redo_<TAG>）
REDO_TAG=tag150 bash _lib/redo.sh 01 02 03
```

- `finish.sh` 的 `--workers 4` 是 4 核心；電腦核心多可以改大，渲染會快很多。
- 已經有成片的會跳過；要重渲染就先刪掉 `NN-名稱/out/` 裡的 mp4。
- 腳本預設**不碰 git**。要每渲染完一支自動 commit + push，設 `AUTO_GIT=1`。

## 共用程式

| 檔案 | 內容 |
|---|---|
| `_lib/cs.js` | 2D 共用：大字、樹、章節標籤、片名卡 |
| `_lib/space.js` | 3D 投影：鏡頭關鍵格、線、球、柱、多邊形、文字 |
| `_lib/palace.js` | 記憶宮殿：六館（顏色＝科目）、43 間房、走廊路徑 |
| `_palace/` | 每支片頭片尾的宮殿飛行片段 |
| `_toolkit/` | [lead-knowledge-animation](https://github.com/AzenYes/leaderai-media-toolkit)（MIT），字型改成繁體 TC 版 |
