@echo off
cd /d "c:\ai\naver-blog-automation"
title Naver Blog Browser
echo ====================================================
echo Starting Naver Blog Browser...
echo A Chrome window for blog writing will open shortly.
echo ====================================================
call npx ts-node -e "import { ensureBrowserOpen } from './src/services/browserManager'; ensureBrowserOpen('reading-kids');"
pause
