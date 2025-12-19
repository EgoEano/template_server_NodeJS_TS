@echo off

cd /d %~dp0

git add .

git diff --cached --quiet
if %errorlevel%==0 (
    echo "Nothing to commit"
	pause
    exit /b
)
	
for /f %%a in ('powershell -command "Get-Date -Format \"HHmm-ddMMyy\""') do set DATETIME=%%a

git commit -m %DATETIME%

git push

echo "Done"
pause