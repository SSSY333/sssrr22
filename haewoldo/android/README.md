# 해월도 마을생활 — 안드로이드 앱

- `haewoldo-village-0.9.1.apk` — 바로 설치할 수 있는 APK (Android 7.0 이상, 세로 전체 화면)
- 게임 파일과 Jua 글꼴이 앱 안에 들어 있어서 인터넷 없이도 플레이할 수 있어요.
- 저장은 앱 데이터(localStorage)에 남아요. 앱을 지우면 저장도 지워져요.
- 카메라 사진은 사진첩 `Pictures/해월도`, 맵 편집 JSON은 `Download/해월도`에 저장돼요.
- 뒤로 가기 버튼: 열린 창을 닫고, 아무 창도 없으면 앱을 내려요.

## 다시 빌드하기
```bash
ANDROID_HOME=/경로/android-sdk KS_PASS=서명비밀번호 ./build_apk.sh <단일 HTML 게임 파일> <글꼴 폴더>
```
서명 키(`release.keystore`)는 저장소에 올리지 않아요. 같은 키로 빌드해야 기존 앱 위에 덮어 설치(업데이트)할 수 있어요.
