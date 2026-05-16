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
echo Procurando dispositivo (192.168.31.150)...
set TARGET_DEVICE=
for /f "tokens=1" %%i in ('adb devices ^| findstr "192.168.31.150"') do (
    set TARGET_DEVICE=%%i
)

if "%TARGET_DEVICE%"=="" (
    echo [ERRO] Dispositivo 192.168.31.150 nao encontrado.
    echo Conecte via: adb connect 192.168.31.150:porta
    pause
    exit /b 1
)

echo Dispositivo selecionado: %TARGET_DEVICE%

echo.
echo Finalizando o aplicativo...
adb -s %TARGET_DEVICE% shell am force-stop com.pontofacil.app

echo.
echo Instalando o aplicativo...
adb -s %TARGET_DEVICE% install -r "%APK_PATH%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCESSO] Aplicativo instalado com sucesso!
    echo Abrindo o aplicativo...
    adb -s %TARGET_DEVICE% shell am start -n com.pontofacil.app/com.pontofacil.app.MainActivity
) else (
    echo.
    echo [ERRO] Falha ao instalar o aplicativo.
    pause
)

echo.
