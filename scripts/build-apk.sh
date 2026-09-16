#!/bin/bash
# Standalone Android APK Builder for Operation Kurup
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
echo "🌴 OPERATION KURUP: Standalone Android APK Builder"
echo "Project Directory: $DIR"

# 1. Sync latest assets
echo "Syncing web assets to android/app/src/main/assets/..."
mkdir -p "$DIR/android/app/src/main/assets"
cp -r "$DIR/public/"* "$DIR/android/app/src/main/assets/"

cd "$DIR/android"

# 2. Check for gradlew or gradle
if [ -f "./gradlew" ]; then
    echo "Running Gradle Wrapper..."
    ./gradlew assembleDebug
elif command -v gradle &> /dev/null; then
    echo "Running system Gradle to assemble APK..."
    gradle assembleDebug
else
    echo "---------------------------------------------------------------"
    echo "Notice: Gradle wrapper or Android SDK not found in local CLI."
    echo "You can open the '$DIR/android' folder directly in Android Studio"
    echo "and click 'Build -> Build Bundle(s) / APK(s) -> Build APK(s)'."
    echo "It will compile into a 100% standalone native Android .apk!"
    echo "---------------------------------------------------------------"
fi

if [ -f "$DIR/android/app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo "✅ Success! Standalone APK created at:"
    echo "$DIR/android/app/build/outputs/apk/debug/app-debug.apk"
fi
