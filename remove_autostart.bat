@echo off
chcp 65001 >nul
schtasks /Delete /TN "CSGrad-Open-Morning" /F >nul 2>nul
schtasks /Delete /TN "CSGrad-Open-Evening" /F >nul 2>nul
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\資工所衝刺站.bat" >nul 2>nul
echo 已取消自動打開網站（每日督導排程不受影響）。
pause
