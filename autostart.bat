@echo off
chcp 65001 >nul
cd /d "%~dp0"
rem 開機或排程時呼叫：在背景（最小化）啟動網站並打開瀏覽器；已經在跑就只打開網頁
where py >nul 2>nul
if %errorlevel%==0 (
  start "資工所衝刺站" /min cmd /c "py -3 server.py"
  goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "資工所衝刺站" /min cmd /c "python server.py"
  goto :eof
)
start "" "%~dp0web\index.html"
