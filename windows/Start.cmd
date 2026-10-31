@echo off
"%~dp0runtime\node.exe" "%~dp0windows.cjs" start
if errorlevel 1 (pause & exit /b 1)
