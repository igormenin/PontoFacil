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

set /p install="Deseja instalar a nova versao agora? (S/N) [N]: "
if /I "%install%"=="S" goto run_installer
if /I "%install%"=="Y" goto run_installer
exit /b 0

:run_installer
echo Iniciando o instalador...
for /f "delims=" %%F in ('dir /b /o-d "release\*Setup.exe"') do (
    start "" "release\%%F"
    exit /b 0
)
exit /b 0
