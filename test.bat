@echo off
chcp 65001 >nul
rem 自我檢查：打開瀏覽器檢查題庫、圖解、短片、每個頁面有沒有壞（不會動到你的進度）
cd /d "%~dp0"
python build.py >nul 2>&1
start "" "%~dp0web\selftest.html"
