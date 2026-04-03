@echo off
setlocal
cd /d "%~dp0..\.."
set "URL=http://localhost:3333"
set /a n=0

:loop
call :probe
if not errorlevel 1 goto openbrowser
set /a n+=1
if %n% geq 120 exit /b 1
timeout /t 1 /nobreak >nul
goto loop

:openbrowser
start "" "%URL%"
exit /b 0

:probe
where curl >nul 2>&1
if errorlevel 1 goto probe_ps
curl -s -f "%URL%" >nul 2>&1
if errorlevel 1 exit /b 1
exit /b 0

:probe_ps
powershell -NoProfile -Command "try { $null = Invoke-WebRequest -Uri '%URL%' -UseBasicParsing -TimeoutSec 2; exit 0 } catch { exit 1 }"
if errorlevel 1 exit /b 1
exit /b 0
