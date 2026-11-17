@echo off
rem 인터넷이 되는 Windows PC에서 한 번만 실행해 BlindTool.exe 를 만듭니다.
rem 만들어진 dist\BlindTool 폴더를 USB 등으로 작업 PC(오프라인)에 복사해 사용합니다.
chcp 65001 > nul
cd /d %~dp0
py -3 -m pip install --upgrade pip
py -3 -m pip install -r requirements.txt pyinstaller
py -3 -m PyInstaller --noconfirm --windowed --name BlindTool --add-data "config.json;." app.py
copy /y config.json dist\BlindTool\config.json
echo.
echo 완료: dist\BlindTool\BlindTool.exe
pause
