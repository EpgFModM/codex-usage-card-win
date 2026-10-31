@echo off
"%~dp0runtime\node.exe" "%~dp0windows.cjs" status
if errorlevel 1 (pause & exit /b 1)
pause
