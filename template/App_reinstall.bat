@echo on
chcp 65001

cd /d %~dp0

rm -rf node_modules package-lock.json
npm cache clean --force
npm install  > log_reinstall.txt 2>&1

pause