# 광화문 온기 오피스 (three.js 3D 웹페이지)

광화문 세종대로의 유리 빌딩 속, 시끌벅적하지만 따뜻한 오피스를 3D로 둘러보는 웹페이지입니다.

## 구성
- **거리**: 가을 은행나무가 늘어선 세종대로, 중앙 광장과 금빛 동상, 멀리 광화문과 북악산, 달리는 차·택시·버스, 걸어가는 사람들, 흩날리는 은행잎 (해 질 녘)
- **입장**: `회사로 입장하기`를 누르면 카메라가 횡단보도를 건너고, 유리 자동문이 열리며 회사 안으로 들어갑니다
- **로비**: 안내 데스크, 대기 벤치
- **업무공간**: 책상·모니터(코드/차트/엑셀/화상회의 화면)·의자, 타이핑하고 통화하는 사람들, 화이트보드 회의
- **휴게실**: 가운데 원형 쇼파에 둘러앉아 수다 떠는 사람들(말하는 사람 쪽으로 고개를 돌려요), 피자와 간식, 링 조명과 전구 줄조명, 탁구대, 주방 카운터
- **수면실**: 침대 4개(자는 사람은 숨쉬고 `Zzz…`), 커튼, 무드등, 별빛 천장, 리클라이너

말풍선이 계속 떠오르고, 사람을 탭/클릭하면 대답해요. 🔊 버튼으로 웅성거림·타자 소리·탁구 소리(WebAudio로 합성)를 켜고 끌 수 있습니다.

## 실사 에셋 (모두 CC0 — 출처 표시 불필요)
`assets/` 폴더 전체 약 2 MB. 원본 1k~2k 스캔을 웹용으로 줄였어요 (텍스처 256~512px WebP, 모델은 meshopt 압축 + 폴리곤 단순화).

| 종류 | 사용한 에셋 (Poly Haven, CC0) |
| --- | --- |
| 3D 스캔/모델 | potted_plant_01·02·04, desk_lamp_arm_01, throw_pillows_01, modern_ceiling_lamp_01, rubber_duck_toy, food_apple_01, concrete_cat_statue, alarm_clock_01, ceramic_vase_01, Ottoman_01, coffee_table_round_01, modern_arm_chair_01, sofa_02 |
| PBR 텍스처 | asphalt_02, pavement_02, large_floor_tiles_02, concrete_floor_02, herringbone_parquet, red_brick_03, oak_veneer_01, walnut_veneer, velour_velvet, rough_linen, rough_wood, large_sandstone_blocks, grey_roof_tiles |
| HDRI 조명 | sunset, apartment (Poly Haven HDRI를 512px EXR로 줄인 `@pmndrs/assets` 버전, CC0) |

캐릭터는 귀여운 2등신 비율로 코드에서 직접 만들고(반짝이는 눈, 볼터치, 깜빡임), 옷에는 스캔 린넨 노멀맵을 입혔어요.

## 휴대폰
- 터치 드래그로 회전, 두 손가락으로 확대/이동
- 세로 화면에서는 카메라 시야각·위치를 자동으로 조정
- 모바일에서는 픽셀 비율과 그림자 해상도를 낮춰 가볍게 동작

## 실행
빌드가 필요 없는 정적 페이지입니다. three.js는 CDN(jsdelivr, `three@0.170.0`)에서 불러옵니다 (용량 계산에서 제외).

```bash
python3 -m http.server 8000
# http://localhost:8000 접속 (같은 Wi-Fi의 휴대폰에서는 http://<PC IP>:8000)
```

GitHub Pages로 배포하면 휴대폰에서 바로 열 수 있습니다 (Settings → Pages → 브랜치 선택).

## 파일
- `index.html` — 페이지 구조, 입장 화면, 하단 내비게이션
- `style.css` — UI 스타일 (safe-area 대응)
- `main.js` — three.js 씬 전체 (거리, 빌딩, 실내, 캐릭터, 애니메이션, 사운드)
- `assets/` — CC0 스캔 모델(.glb), PBR 텍스처(.webp), HDRI(.exr)
