@echo off
setlocal
call "%~dp0preflight.bat"
if errorlevel 1 exit /b %errorlevel%
start "keremflix-wait" /min "%ComSpec%" /c call "%~dp0start_windows_wait.bat"
call "%~dp0run_dev.bat"
endlocal
