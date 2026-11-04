@echo off
chcp 65001 >nul
cd /d "%~dp0"
set USED_AI=0
where claude >nul 2>nul
if %errorlevel%==0 (
  claude -p "依照 AGENTS.md 第 6 節執行一次每日督導：先用 python agent.py report 讀進度，再用 python agent.py supervise 寫回評語與今日任務。" --allowedTools "Bash(python agent.py:*)" "Bash(py -3 agent.py:*)" "Read" "Write" && set USED_AI=1
)
if "%USED_AI%"=="1" goto :eof
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 agent.py supervise --auto
) else (
  python agent.py supervise --auto
)
