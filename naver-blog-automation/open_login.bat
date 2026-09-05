@echo off
title Naver Login
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="c:\ai\naver-blog-automation\data\naver_user_data" https://nid.naver.com/nidlogin.login
exit
