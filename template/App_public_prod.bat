:: 0. Init settings
@echo off
chcp 65001 >nul
cd /d %~dp0

set LOG=log_app_build.txt
echo Starting build... > %LOG%

:: 1.1 Compile client code into public
@REM echo Building client...
@REM cmd /c "npm run client:build:prod > log_client_build_prod.txt 2>&1"
@REM :: Result checking
@REM if %ERRORLEVEL% neq 0 (
@REM     echo 0 - public:client:build > log_app_build.txt
@REM     exit /b 1
@REM )

:: 1.2 TypeScript → JavaScript compilation
if not exist docker_dist mkdir docker_dist
echo Compiling TypeScript...
cmd /c "npx tsc --outDir docker_dist >> log_app_build.txt 2>&1"
if %ERRORLEVEL% neq 0 (
    echo 0 - public:server:tsc >>  %LOG%
    exit /b 1
)

:: 1.3 Prepare before NCC
echo Preparing bundle source...
rename docker_dist\index.js bundle.js

:: 1.4 Compile server code in one file (index.js)
echo Building server...
cmd /c "npx @vercel/ncc build docker_dist/bundle.js -o docker_dist --external dotenv --external bcrypt >> log_app_build.txt 2>&1"
if %ERRORLEVEL% neq 0 (
    echo 0 - public:server:build >>  %LOG%
    exit /b 1
)

:: 2.1 Minifying server code
echo Minifying server...
cmd /c "npx esbuild docker_dist/index.js --format=esm --outfile=docker_dist/index.min.js --keep-names --minify-syntax --minify-whitespace --minify-identifiers >> log_app_build.txt 2>&1"
if %ERRORLEVEL% neq 0 (
    echo 0 - public:server:minifying >>  %LOG%
    exit /b 1
)

:: 2.2 Obfuscating server code
echo Obfuscating server...
cmd /c "npx javascript-obfuscator docker_dist/index.min.js --output docker_dist/server.js --self-defending true --compact true >> log_app_build.txt 2>&1"
if %ERRORLEVEL% neq 0 (
    echo 0 - public:server:obfuscating >>  %LOG%
    exit /b 1
)

:: 3.1 Deleting temp files
del /f /q docker_dist\index.d.ts 2>nul
del /f /q docker_dist\index.d.ts.map 2>nul
del /f /q docker_dist\index.js.map 2>nul
@REM del /f /q docker_dist\package.json 2>nul

rd /s /q docker_dist\core 2>nul
rd /s /q docker_dist\modules 2>nul

del /f /q docker_dist\bundle.js 2>nul
del /f /q docker_dist\index.js 2>nul
del /f /q docker_dist\index.min.js 2>nul

:: 3.2 Copying client build into dist
if exist docker_dist\public rd /s /q docker_dist\public
@REM xcopy /E /I /Y public dist\public

:: 3.3 Очистка и копирование и sec/
:: 3.3 Cleansing and copying sec/
::if exist dist\sec rd /s /q dist\sec
::xcopy /E /I /Y sec dist\sec

:: 4. Final
echo 1 - public:success >>  %LOG% 2>&1
timeout /t 5 /nobreak >nul