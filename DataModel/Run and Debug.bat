@echo off
cd /d "%~dp0"
title TigerTurf - Run and Debug
echo ============================================
echo    TigerTurf Data Model - Run and Debug
echo ============================================
echo.
echo Running automated tests (server test port 4399)...
echo.
node debug.js
set DBGRESULT=%errorlevel%
echo.
if not "%DBGRESULT%"=="0" (
  echo *** DEBUG FOUND PROBLEMS - see the FAILED lines above. ***
  echo.
  pause
  exit /b %DBGRESULT%
)
echo All tests passed.
echo.
set /p OPENNOW="Start the database viewer now? (Y/N) "
if /i "%OPENNOW%"=="Y" (
  echo.
  echo Starting server in a new window at http://localhost:4321
  echo To stop the server, close that window.
  start "TigerTurf Server - close this window to stop" cmd /k node server.js
  timeout /t 2 >nul
  start "" "http://localhost:4321"
  exit /b 0
)
echo.
echo Done.
pause
