@echo off
chcp 65001 >nul
cd /d %~dp0

:: ==========================
::   Configuration
:: ==========================
set LOG=log_app_docker.txt
set EXPORT_DIR=C:\Projects\docker_export
set WSL_EXPORT_DIR=/mnt/c/Projects/docker_export
set WSL_IMPORT_DIR=/mnt/x/iHolding/dev/cryptoProject1
set WSL_IMPORT_DIR=/mnt/x/transitRepos/grimoire/forge/template-in-process/template_server_NodeJS_TS
set EXPORT_TAR=test_app.tar
set EXPORT_ARCHIVE=testProject.deploy.tar.gz
set IMAGE_NAME=test-project-app:latest
set VOLUME_NAME=testproject_pgdata
set WSL_DISTRO=Ubuntu
set BUILD_ID=%date%_%time%

echo [INFO] === Docker build pipeline started at %BUILD_ID% === > %LOG%

:: ==========================
::   1. Clear old build (only local in dev area)
:: ==========================
echo [STEP] Cleaning old containers and volumes... >> %LOG%
docker-compose down -v >> %LOG% 2>&1

:: Deleting only project volume
docker volume rm %VOLUME_NAME% >> %LOG% 2>nul

:: ==========================
::   2. Bulid & Launch
:: ==========================
echo [STEP] Building and starting Docker containers... >> %LOG%
docker-compose up --build -d >> %LOG% 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker build or startup failed >> %LOG%
    exit /b 1
)

:: ==========================
::   3. Healthcheck
:: ==========================
echo [STEP] Checking container health... >> %LOG%
:: Пример проверки: ждём 20 секунд и проверяем статус
timeout /t 20 /nobreak >nul
docker ps --format "table {{.Names}}\t{{.Status}}" >> %LOG% 2>&1

:: Можно добавить проверку через curl (пример):
:: curl http://localhost:3000/health -f -s || (
::     echo [ERROR] Health check failed >> %LOG%
::     exit /b 1
:: )

:: ==========================
::   4. Stopping container after checking
:: ==========================
echo [STEP] Stopping containers... >> %LOG%
docker-compose down >> %LOG% 2>&1

:: ==========================
::   5. Docker-image export
:: ==========================
echo [STEP] Exporting Docker image... >> %LOG%
if not exist "%EXPORT_DIR%" mkdir "%EXPORT_DIR%"
docker save -o "%EXPORT_DIR%\%EXPORT_TAR%" %IMAGE_NAME% >> %LOG% 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker image export failed >> %LOG%
    exit /b 1
)

:: Проверяем, что tar действительно создан
:: Checking tar existence
if not exist "%EXPORT_DIR%\%EXPORT_TAR%" (
    echo [ERROR] Exported image file not found >> %LOG%
    exit /b 1
)

:: ==========================
::   6. Archiving project via WSL
:: ==========================
echo [STEP] Archiving project via WSL... >> %LOG%
wsl -d %WSL_DISTRO% tar -czvf "%WSL_EXPORT_DIR%/%EXPORT_ARCHIVE%" -C "%WSL_EXPORT_DIR%" "%EXPORT_TAR%" -C "%WSL_IMPORT_DIR%" docker-compose-export.yml .env docker/ >> %LOG% 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Tar compression failed >> %LOG%
    exit /b 1
)

:: Checking gzip archive integrity
wsl -d %WSL_DISTRO% gzip -t "%WSL_EXPORT_DIR%/%EXPORT_ARCHIVE%"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Gzip integrity check failed >> %LOG%
    exit /b 1
)

:: ==========================
::   7. Archive recoverability checking (optional)
:: ==========================
@REM echo [STEP] Test docker load from exported archive... >> %LOG%
@REM wsl -d %WSL_DISTRO% bash -c "docker load -i %WSL_EXPORT_DIR%/%EXPORT_TAR%" >> %LOG% 2>&1
@REM if %ERRORLEVEL% neq 0 (
@REM     echo [WARN] docker load test failed (optional check) >> %LOG%
@REM )

:: ==========================
::   8. Cleaning temp files
:: ==========================
echo [STEP] Cleaning temporary files... >> %LOG%
del /f /q "%EXPORT_DIR%\%EXPORT_TAR%" 2>nul

:: ==========================
::   9. Final
:: ==========================
echo [SUCCESS] Docker pipeline completed successfully >> %LOG%
echo [INFO] Exported archive: %EXPORT_DIR%\%EXPORT_ARCHIVE% >> %LOG%
echo [INFO] Build finished at %time% >> %LOG%
timeout /t 3 /nobreak >nul
exit /b 0
