@echo off
cd /d "c:\ai\naver-blog-automation"
title Naver Login Helper
echo ====================================================
echo Starting Naver Login Helper...
echo Chrome browser window will open shortly.
echo ====================================================
call npx ts-node src/scripts/loginHelper.ts
echo.
echo Press any key to exit...
pause > nul
