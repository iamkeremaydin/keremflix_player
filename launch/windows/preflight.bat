@echo off
setlocal
cd /d "%~dp0..\.."

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo Node.js was not found. Keremflix needs Node.js to run.
  echo Opening the Node.js download page...
  start "" "https://nodejs.org/en/download"
  echo.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo.
  echo npm was not found. Reinstall Node.js from nodejs.org ^(npm is included^).
  start "" "https://nodejs.org/en/download"
  echo.
  pause
  exit /b 1
)

powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 3333 -State Listen -ErrorAction SilentlyContinue) { exit 1 } else { exit 0 }" >nul 2>&1
if errorlevel 1 (
  echo.
  echo Port 3333 is already in use. Close the other program or run stop_windows.bat if Keremflix is already running.
  echo.
  pause
  exit /b 3
)

if not exist "node_modules\" (
  echo Installing dependencies ^(first run may take a minute^)...
  call npm install --no-fund --no-audit --loglevel=error
  if errorlevel 1 (
    echo.
    echo npm install failed. See messages above.
    echo.
    pause
    exit /b 2
  )
)

echo Preflight OK. Starting Keremflix on http://localhost:3333
timeout /t 2 /nobreak >nul
exit /b 0
