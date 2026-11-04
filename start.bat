@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 資工所衝刺站
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 server.py
  goto :end
)
where python >nul 2>nul
if %errorlevel%==0 (
  python server.py
  goto :end
)
echo 找不到 Python。請到 https://www.python.org/downloads/ 安裝（勾選 Add python.exe to PATH）。
echo 現在先用瀏覽器直接打開網站；到「Agent 對話」頁按「連接 bridge 資料夾」即可使用檔案橋接。
start "" "%~dp0web\index.html"
:end
pause
