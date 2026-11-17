#!/bin/bash
# 해월도 마을생활 APK 빌드 — Gradle 없이 Android SDK 빌드 도구만 사용
# 사용법: ANDROID_HOME=/경로/android-sdk KS_PASS=비밀번호 ./build_apk.sh <게임 단일 HTML> <Jua 글꼴 폴더(fonts.css 포함, 선택)>
set -euo pipefail
SDK=${ANDROID_HOME:?ANDROID_HOME 이 필요해요}
BT=$SDK/build-tools/34.0.0; JAR=$SDK/platforms/android-34/android.jar
HERE=$(cd "$(dirname "$0")" && pwd); HTML=${1:?단일 HTML 파일 경로}; FONTS=${2:-}
OUT=$HERE/build; rm -rf "$OUT"; mkdir -p "$OUT/assets" "$OUT/res" "$OUT/classes" "$OUT/dex"
# 1) 게임 파일 (글꼴은 앱 안에 넣어 오프라인에서도 같은 모양)
python3 - "$HTML" "$OUT/assets/index.html" "$FONTS" <<'PY'
import sys, re, os, shutil
src, dst, fonts = sys.argv[1], sys.argv[2], sys.argv[3]
body = open(src, encoding='utf-8').read()
if fonts and os.path.isfile(os.path.join(fonts, 'fonts.css')):
    body = re.sub(r'<link rel="preconnect"[^>]*>\n?', '', body)
    body = re.sub(r'<link href="https://fonts.googleapis.com[^>]*>', '<link rel="stylesheet" href="fonts.css">', body)
    shutil.copy(os.path.join(fonts, 'fonts.css'), os.path.join(os.path.dirname(dst), 'fonts.css'))
    shutil.copytree(os.path.join(fonts, 'fonts'), os.path.join(os.path.dirname(dst), 'fonts'))
head = '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">'
open(dst, 'w', encoding='utf-8').write(head + '</head><body>' + body + '</body></html>')
PY
# 2) 리소스 · 매니페스트
"$BT/aapt2" compile --dir "$HERE/res" -o "$OUT/res.zip"
"$BT/aapt2" link -o "$OUT/base.apk" -I "$JAR" --manifest "$HERE/AndroidManifest.xml" -A "$OUT/assets" "$OUT/res.zip" --min-sdk-version 24 --target-sdk-version 34
# 3) 자바 → dex
javac -nowarn -source 8 -target 8 -bootclasspath "$JAR" -d "$OUT/classes" $(find "$HERE/src" -name "*.java")
(cd "$OUT/classes" && jar cf "$OUT/classes.jar" .); D8="$SDK/cmdline-tools/latest/bin/d8"; [ -x "$D8" ] || D8="$BT/d8"; "$D8" --min-api 24 --lib "$JAR" --output "$OUT/dex" "$OUT/classes.jar"
cp "$OUT/base.apk" "$OUT/unsigned.apk"; (cd "$OUT/dex" && zip -q -j "$OUT/unsigned.apk" classes.dex)
# 4) 정렬 · 서명
"$BT/zipalign" -f -p 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"
KS=${KEYSTORE:-$HERE/release.keystore}; PASS=${KS_PASS:?서명 비밀번호(KS_PASS)를 환경 변수로 주세요}
[ -f "$KS" ] || keytool -genkeypair -keystore "$KS" -storepass "$PASS" -keypass "$PASS" -alias haewoldo -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Haewoldo Village, O=Haewoldo, C=KR" >/dev/null 2>&1
"$BT/apksigner" sign --ks "$KS" --ks-pass env:KS_PASS --key-pass env:KS_PASS --ks-key-alias haewoldo --out "$OUT/haewoldo-village.apk" "$OUT/aligned.apk"
"$BT/apksigner" verify "$OUT/haewoldo-village.apk" && echo "APK: $OUT/haewoldo-village.apk"
