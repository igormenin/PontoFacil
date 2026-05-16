@echo off
echo ========================================================
echo   Instalador do Ponto Facil via ADB
echo ========================================================

set "APK_PATH=ponto-facil-android\android\app\build\outputs\apk\release\app-release.apk"

:: Verifica se o arquivo APK existe
if not exist "%APK_PATH%" (
    echo [ERRO] O arquivo APK nao foi encontrado em:
    echo %cd%\%APK_PATH%
    echo Por favor, certifique-se de que o build foi concluido com sucesso.
    pause
    exit /b 1
)

echo [INFO] Copiando APK para a area de transferencia...
powershell -NoProfile -Command "Set-Clipboard -Path '%APK_PATH%'"

echo.
echo Procurando dispositivos na rede 192.168.31.x...

set FOUND=0
for /f "tokens=1" %%i in ('adb devices ^| findstr "192.168.31." ^| findstr /v "offline"') do (
    set FOUND=1
    echo.
    echo --------------------------------------------------------
    echo [DISPOSITIVO] Instalando em %%i...
    echo --------------------------------------------------------
    
    echo [1/3] Finalizando o aplicativo...
    adb -s %%i shell am force-stop com.pontofacil.app
    
    echo [2/3] Instalando o aplicativo...
    adb -s %%i install -r "%APK_PATH%"
    
    if %ERRORLEVEL% EQU 0 (
        echo [3/3] Abrindo o aplicativo...
        adb -s %%i shell am start -n com.pontofacil.app/com.pontofacil.app.MainActivity
        echo [OK] Sucesso em %%i
    ) else (
        echo [ERRO] Falha ao instalar em %%i
    )
)

if "%FOUND%"=="0" (
    echo.
    echo [AVISO] Nenhum dispositivo ativo na rede 192.168.31.x foi encontrado.
    echo Certifique-se de que o ADB Wireless esta ativo nos aparelhos.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   PROCESSO CONCLUIDO EM TODOS OS DISPOSITIVOS
echo ========================================================
pause
