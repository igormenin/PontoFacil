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

echo.
echo Procurando dispositivos conectados...
adb devices

echo.
echo Finalizando o aplicativo (se estiver aberto)...
adb shell am force-stop com.pontofacil.app

echo.
echo Instalando o aplicativo...
adb install -r "%APK_PATH%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCESSO] Aplicativo instalado com sucesso no seu smartphone!
    echo Abrindo o aplicativo...
    adb shell am start -n com.pontofacil.app/com.pontofacil.app.MainActivity
) else (
    echo.
    echo [ERRO] Falha ao instalar o aplicativo. Verifique se:
    echo 1. O celular esta conectado via USB.
    echo 2. A "Depuracao USB" esta ativada nas Opcoes do Desenvolvedor.
    echo 3. A tela do celular esta desbloqueada e voce aceitou o prompt de depuracao.
)

echo.
pause
