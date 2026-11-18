@echo off
rem 인터넷이 되는 Windows PC에서 한 번만 실행해 BlindTool.exe 를 만듭니다.
rem 만들어진 dist\BlindTool 폴더를 USB 등으로 작업 PC(오프라인)에 복사해 사용합니다.
rem 자동 인식(타이핑 글자)을 쓰려면 먼저 Tesseract OCR(UB Mannheim 배포판)을
rem 설치하면서 Korean 언어를 선택하세요. 설치되어 있으면 함께 복사됩니다.
chcp 65001 > nul
cd /d %~dp0
py -3 -m pip install --upgrade pip
py -3 -m pip install -r requirements.txt pyinstaller
py -3 -m PyInstaller --noconfirm --windowed --name BlindTool --add-data "config.json;." app.py
copy /y config.json dist\BlindTool\config.json
copy /y 사용설명서.md dist\BlindTool\사용설명서.md
if exist "C:\Program Files\Tesseract-OCR\tesseract.exe" (
  xcopy /e /i /q /y "C:\Program Files\Tesseract-OCR" dist\BlindTool\tesseract
  echo Tesseract OCR 포함됨
) else (
  echo [알림] Tesseract OCR 이 없어 자동 인식 제안 없이 만들어졌습니다.
)
echo.
echo 완료: dist\BlindTool\BlindTool.exe
pause
