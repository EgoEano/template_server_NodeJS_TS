@echo on
chcp 65001

cd /d %~dp0
npm run server:build:prod > log_server_build_prod.txt 2>&1
@REM npm run server:build:prod

pause