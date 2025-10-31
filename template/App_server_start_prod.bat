@echo on
chcp 65001

cd /d %~dp0
npm run server:start:prod > log_server_start_prod.txt 2>&1
@REM npm run server:start:prod

pause