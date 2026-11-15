# 資工所衝刺站

台大資工所備考網站，包含 219 個知識點、10,011 題練習題、43 支教學影片、原卷模考、錯題複習與本機進度備份。

## 快速開始

1. 到 [Releases](https://github.com/thousandflame1000/cs-/releases) 下載最新的完整 ZIP 並解壓縮。
2. 安裝 [Python 3](https://www.python.org/downloads/)。
3. Windows 執行 `start.bat`。macOS／Linux 執行 `python3 server.py`。
4. 開啟 http://127.0.0.1:8765/ ，使用期間保持伺服器開啟。

完整操作請讀 [使用說明](使用說明.md)，涵蓋看影片、刷題、模考、備份與升級。

## 開發

使用 Python 標準函式庫執行 `python build.py`，可重建 `web/js/data.js` 與 `dist/single.html`。教材與題庫原稿位於 `content`。完整本機版的影片位於 `web/media` 和 `web/videos`。影片隨 Release ZIP 提供。使用 git clone 的開發者請從完整 ZIP 取出這兩個資料夾。

## 進度資料

使用者的進度、對話、配對資料存放於本機瀏覽器與 `bridge`。儲存庫僅保留空目錄標記，發行包不含使用者紀錄。題庫解答尚未逐題全面覆核，原卷成績採人工核分。
