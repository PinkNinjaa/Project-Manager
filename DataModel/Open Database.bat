@echo off
cd /d "%~dp0"
echo Starting Data Model server...
node server.js > server.log 2>&1 &
echo.
echo Server starting at http://localhost:4321
echo Opening browser...
timeout /t 2 >nul
start "" "http://localhost:4321"
echo.
echo The server is running in the background. Keep this window open.
echo Close this window to stop the server.
pause
