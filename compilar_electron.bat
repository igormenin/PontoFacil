@echo off
setlocal
echo ===================================================
echo   Ponto Facil - Compilador Electron (.exe)
echo ===================================================
echo.

cd /d "%~dp0\pontofacil-electron"

echo [1/3] Instalando/Verificando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao instalar dependencias.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Compilando frontend (Vite)...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha na compilacao do frontend.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] Gerando executaveis (Electron Builder)...
call npx electron-builder --config electron-builder.config.js
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao gerar o executavel.
    pause
    exit /b %errorlevel%
)

echo.
echo ===================================================
echo   SUCESSO! Os arquivos estao em:
echo   pontofacil-electron\release
echo ===================================================
echo.
pause
