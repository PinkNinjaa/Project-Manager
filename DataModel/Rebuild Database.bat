@echo off
cd /d "%~dp0"
echo Rebuilding database from workbook...
echo This will recreate data_model.sqlite from TigerTurf_Data_Model.xlsx
echo.
echo WARNING: Any data you typed in the browser will be replaced.
echo A backup of the current database will be saved to the backups/ folder.
echo.
pause
node build_db.js
echo.
echo Build complete.
echo Check build_report.txt for details.
pause
