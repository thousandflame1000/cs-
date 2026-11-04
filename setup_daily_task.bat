@echo off
chcp 65001 >nul
schtasks /Create /SC DAILY /TN "CSGrad-Daily-Supervise" /TR "\"%~dp0daily_supervise.bat\"" /ST 07:30 /F
if %errorlevel%==0 (
  echo 已建立每天 07:30 的督導排程（工作排程器裡的 CSGrad-Daily-Supervise）。
) else (
  echo 建立失敗，請按右鍵「以系統管理員身分執行」再試一次。
)
pause
