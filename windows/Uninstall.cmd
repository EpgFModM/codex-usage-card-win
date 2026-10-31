@echo off
"%~dp0runtime\node.exe" "%~dp0windows.cjs" uninstall
if errorlevel 1 (pause & exit /b 1)
pause
