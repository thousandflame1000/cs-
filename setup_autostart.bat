@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo  讓電腦每天自動把讀書網站打開（對抗「等一下再讀」）
echo ============================================================
echo.
set "T1=08:30"
set /p "T1=每天幾點開始讀書？（例如 08:30，直接按 Enter 用 08:30）："
set "T2=21:30"
set /p "T2=晚上幾點提醒打卡？（例如 21:30，直接按 Enter 用 21:30）："
schtasks /Create /SC DAILY /TN "CSGrad-Open-Morning" /TR "\"%~dp0autostart.bat\"" /ST %T1% /F >nul
if %errorlevel%==0 (echo [OK] 每天 %T1% 自動打開網站) else (echo [失敗] 早上排程沒建立成功，可按右鍵「以系統管理員身分執行」再試)
schtasks /Create /SC DAILY /TN "CSGrad-Open-Evening" /TR "\"%~dp0autostart.bat\"" /ST %T2% /F >nul
if %errorlevel%==0 (echo [OK] 每天 %T2% 再打開一次，提醒你打卡) else (echo [失敗] 晚上排程沒建立成功)
set "SU=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
> "%SU%\資工所衝刺站.bat" echo @chcp 65001 ^>nul
>> "%SU%\資工所衝刺站.bat" echo @call "%~dp0autostart.bat"
if exist "%SU%\資工所衝刺站.bat" (echo [OK] 開機登入後也會自動打開網站) else (echo [失敗] 沒辦法寫入開機啟動資料夾)
echo.
echo 想取消：執行 remove_autostart.bat
pause
