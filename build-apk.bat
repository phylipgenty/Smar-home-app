@echo off
echo Building React Native APK...

REM Create the bundle directory if it doesn't exist
if not exist "android\app\src\main\assets" mkdir "android\app\src\main\assets"

REM Bundle the JavaScript code
echo Bundling JavaScript...
node "C:\Program Files\nodejs\node_modules\npm\bin\npx-cli.js" react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/

REM Check if we have Android SDK
if not defined ANDROID_HOME (
    echo ERROR: ANDROID_HOME is not set
    echo Please install Android Studio and set ANDROID_HOME environment variable
    pause
    exit /b 1
)

REM Try to build with gradle if available
if exist "%ANDROID_HOME%\tools\bin\gradle.bat" (
    echo Building APK with Gradle...
    cd android
    "%ANDROID_HOME%\tools\bin\gradle.bat" assembleDebug
    cd ..
) else (
    echo Gradle not found in Android SDK
    echo Please install Android Studio with Gradle support
)

echo Done! Check android/app/build/outputs/apk/debug/ for the APK file
pause
