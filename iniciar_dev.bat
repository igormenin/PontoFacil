@echo off
title Ponto Facil Launcher
color 0A

echo ========================================
echo        INICIANDO PONTO FACIL
echo ========================================
echo.

echo [1/2] Iniciando o Servidor Backend...
start "Ponto Facil - Backend Server" cmd /k "cd backend && npm run dev"

timeout /t 5 /nobreak >nul

echo [2/2] Iniciando a Aplicacao Electron...
start "Ponto Facil - Electron App" cmd /k "cd pontofacil-electron && npm run start"

echo.
echo ========================================
echo Tudo iniciado! Voce pode fechar esta janela.
echo ========================================
timeout /t 3 >nul
