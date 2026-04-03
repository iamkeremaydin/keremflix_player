@echo off
setlocal enabledelayedexpansion
set "FOUND=0"

for /f "usebackq delims=" %%p in (`powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3333 -State Listen -ErrorAction SilentlyContinue ^| Select-Object -ExpandProperty OwningProcess -Unique"`) do (
  if not "%%p"=="" (
    set "FOUND=1"
    taskkill /PID %%p /T /F >nul 2>&1
  )
)

echo.
if "!FOUND!"=="0" (
  echo No process was found listening on port 3333 ^(Keremflix may already be stopped^).
) else (
  echo Keremflix server on port 3333 has been stopped.
)
echo.
pause
endlocal
