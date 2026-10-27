@echo off
title NTIS Cloudflare Public Tunnel
color 0E
echo ========================================================
echo         NTIS Platform - Global Internet Tunnel
echo ========================================================
echo.
echo Launching Cloudflare Tunnel to expose http://localhost:3000 to the world...
echo Once created, you will see a public https://*.trycloudflare.com link below.
echo You can open that link on any device, anywhere in the world!
echo.
echo ========================================================
echo.
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3000
pause

