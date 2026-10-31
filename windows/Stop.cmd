@echo off
"%~dp0runtime\node.exe" "%~dp0windows.cjs" stop
if errorlevel 1 (pause & exit /b 1)
