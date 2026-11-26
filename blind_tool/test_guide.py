"""자동 인식 제안 테스트 (가상 타이핑 문서 사용). Tesseract가 없으면 건너뜀.

실행: python test_guide.py
"""

import os
import sys

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import core  # noqa: E402
import guide  # noqa: E402

LINES = [
    "INITIAL SOCIAL HISTORY", "Child's Name : Kim, Min Ji", "Birth Date : June 7, 1983",
    "BACKGROUND INFORMATION",
    "Biological              Father                              Mother",
    "Name :         Park, Soo Youn                    Choi, Soon Ja",
    "Birth Date :   1955. 3. 2                           Oct. 12, 1958",
    "Address :      Seoul Jongno-gu Hyehwa-dong 123",
    "친모 성명 : 김영희", "생년월일 : 1960년 5월 3일", "주소 : 서울특별시 종로구 혜화동 12번지",
    "STATUS", "The mother Soon Ja visited the agency. 영희가 상담을 받았다.",
]


def main():
    if not guide.available():
        print("Tesseract 없음 - 건너뜀")
        return
    font = ImageFont.truetype(core.find_korean_font(), 40)
    im = Image.new("RGB", (2480, 1400), "white")
    d = ImageDraw.Draw(im)
    for i, t in enumerate(LINES):
        d.text((120, 60 + i * 100), t, font=font, fill="black")
    sugg, found = guide.suggest(im, {"name": "N", "birth": "B", "addr": "A"})
    reasons = " | ".join(s.reason for s in sugg)
    print(found, reasons, sep="\n")
    assert {"Soo Youn", "Soon Ja"} <= found, found
    assert "Min Ji" not in reasons, "아동 이름이 제안됨"
    assert any(s.cat == "A" and "Hyehwa" in s.reason for s in sugg)
    assert any(s.cat == "B" for s in sugg)
    assert any("재등장" in s.reason for s in sugg)
    # 성(Park, Choi)은 가리지 않아야 한다: 'Park,' 단어 위치(x≈285*1.24)보다 오른쪽에서 시작
    for s in sugg:
        if "Soo Youn" in s.reason and "재등장" not in s.reason:
            assert s.x0 > 420, s
    print("자동 인식 테스트 통과")


if __name__ == "__main__":
    main()
