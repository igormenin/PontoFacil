# Script de Build Local - Ponto Fácil (Isolado)
# Este script configura o ambiente apenas para esta sessão do terminal e compila o app Android.

# ==========================================================
# --- AJUSTE OS CAMINHOS ABAIXO CONFORME SEU SISTEMA ---
# ==========================================================
$JAVA_17_PATH = "C:\Program Files\Java\jdk-17" 
$ANDROID_SDK_PATH = "C:\AndroidSDK\GX18U13"
# ==========================================================

Write-Host "`n--- Configurando Ambiente Isolado para Ponto Facil ---" -ForegroundColor Cyan

# 1. Validar e Configurar JAVA_HOME
if (Test-Path $JAVA_17_PATH) {
    $env:JAVA_HOME = $JAVA_17_PATH
    $env:Path = "$env:JAVA_HOME\bin;" + $env:Path
    Write-Host "[OK] JAVA_HOME temporário definido para JDK 17" -ForegroundColor Green
} else {
    Write-Host "[ERRO] Pasta do Java 17 nao encontrada em: $JAVA_17_PATH" -ForegroundColor Red
    Write-Host "Por favor, instale o JDK 17 ou aponte para a pasta 'jbr' do Android Studio."
    pause
    exit 1
}

# 2. Validar e Configurar ANDROID_HOME
if (Test-Path $ANDROID_SDK_PATH) {
    $env:ANDROID_HOME = $ANDROID_SDK_PATH
    $env:Path = "$env:ANDROID_HOME\platform-tools;" + "$env:ANDROID_HOME\emulator;" + $env:Path
    Write-Host "[OK] ANDROID_HOME definido e ferramentas adicionadas ao Path" -ForegroundColor Green
} else {
    Write-Host "[ERRO] Android SDK nao encontrado em: $ANDROID_SDK_PATH" -ForegroundColor Red
    pause
    exit 1
}

# 3. Verificação de Sanidade
Write-Host "`nVerificando versoes das ferramentas:" -ForegroundColor Yellow
java -version
Write-Host ""
eas --version

# 4. Iniciar Build Nativo (Fluxo Windows)
Write-Host "`n--- Iniciando Compilacao Nativa (Metodo Windows) ---" -ForegroundColor Magenta

# Entrar no diretorio do mobile
cd ponto-facil-android

Write-Host "1. Gerando pastas nativas (prebuild)..."
npx expo prebuild --platform android --no-install

Write-Host "`n2. Compilando APK via Gradle..."
cd android
./gradlew assembleRelease

# Voltar para a pasta raiz
cd ../..

Write-Host "`n--- FIM ---" -ForegroundColor Green
Write-Host "Se tudo deu certo, seu APK estara em: ponto-facil-android\android\app\build\outputs\apk\release\"
