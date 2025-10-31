@echo on
chcp 65001

cd /d %~dp0
@REM npm run server:start:dev > log_server_start_dev.txt 2>&1
npm run server:start:dev

pause