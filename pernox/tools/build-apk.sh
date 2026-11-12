#!/usr/bin/env bash
# APK 빌드 (Gradle 없이 Android SDK build-tools 직접 사용)
#   필요: ANDROID_HOME (build-tools 34.0.0, platforms;android-34), JDK 17+
#   결과: dist/pernox-0.2.0.apk
set -euo pipefail
cd "$(dirname "$0")/.."
SDK="${ANDROID_HOME:-/opt/android}"
BT="$SDK/build-tools/35.0.0"
JAR="$SDK/platforms/android-34/android.jar"
OUT=build/apk
rm -rf "$OUT"; mkdir -p "$OUT/res" "$OUT/classes" dist
node tools/build.js >/dev/null
"$BT/aapt2" compile --dir android/res -o "$OUT/res.zip"
"$BT/aapt2" link -o "$OUT/base.apk" -I "$JAR" --manifest android/AndroidManifest.xml -A android/assets "$OUT/res.zip" --min-sdk-version 24 --target-sdk-version 34 --version-code 2 --version-name 0.2.0
javac -nowarn -g --release 8 -cp "$JAR" -d "$OUT/classes" android/src/kr/pernox/game/*.java 2>&1 | grep -v "bootstrap class path" || true
(cd "$OUT/classes" && jar cf ../classes.jar .)
"$BT/d8" --lib "$JAR" --min-api 24 --output "$OUT" "$OUT/classes.jar"
cp "$OUT/base.apk" "$OUT/unsigned.apk"
(cd "$OUT" && zip -q -j unsigned.apk classes.dex)
"$BT/zipalign" -f -p 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"
KS=build/debug.keystore
[ -f "$KS" ] || keytool -genkeypair -keystore "$KS" -storepass android -keypass android -alias pernox -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Pernox Debug" >/dev/null 2>&1
"$BT/apksigner" sign --ks "$KS" --ks-pass pass:android --key-pass pass:android --ks-key-alias pernox --out dist/pernox-0.2.0.apk "$OUT/aligned.apk"
"$BT/apksigner" verify dist/pernox-0.2.0.apk
ls -la dist/pernox-0.2.0.apk
