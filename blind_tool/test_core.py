"""핵심 로직 자동 테스트 (가상 이미지 사용, 실제 기록물 불필요).

실행: python test_core.py
"""

import os
import sys
import tempfile

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import core  # noqa: E402
import pymupdf  # noqa: E402


def make_sample(folder):
    for n in range(3):
        im = Image.new("RGB", (1240, 1754), "white")
        d = ImageDraw.Draw(im)
        for y in range(100, 1700, 40):
            d.text((100, y), f"Name: Koh, Secret Name {n}-{y}", fill="black")
        im.save(os.path.join(folder, f"{n + 1:02d}.png"), dpi=(150, 150))


def main():
    with tempfile.TemporaryDirectory() as tmp:
        make_sample(tmp)
        pr = core.Project(tmp)
        pr.user = "테스트"
        a, b, c = pr.pages
        cat = core.cat_list(pr.config)[0]["name"]
        pr.add_box(a, 150, 95, 400, 120, cat)
        pr.add_box(b, 150, 135, 400, 160, cat)
        pr.set_deleted(c, True, core.reason_list(pr.config)[0]["name"])

        pr.lock(a)
        try:
            pr.add_box(a, 0, 0, 50, 50, cat)
            raise AssertionError("확정 페이지에 박스가 추가됨")
        except core.LockedError:
            pass
        try:
            core.export(pr)
            raise AssertionError("미확정 페이지가 있는데 내보내기가 됨")
        except core.ProjectError:
            pass

        pr.lock(b)
        pr.lock(c)
        pr = core.Project(tmp)  # 다시 열어도 그대로인지
        pr.user = "테스트"
        assert [len(p.boxes) for p in pr.pages] == [1, 1, 0]
        assert all(p.locked for p in pr.pages)

        rr = {r["id"]: r["pages"] for r in core.build_rule_rows(pr)}
        assert rr["R2"] == "p. 1-2", rr
        assert rr["R1"].startswith("1면 삭제") and "p. 3" in rr["R1"], rr
        assert core.build_rule_rows(pr, 2)[1]["pages"] == "p. 3-4"
        res = core.export(pr, attach_table="front")
        assert not res["problems"], res["problems"]
        with pymupdf.open(res["pdf"]) as doc:
            assert doc.page_count >= 2
            for page in doc:
                assert not page.get_text().strip(), "텍스트 층이 있음"
                assert not list(page.annots())
        # 덮지 않은 영역을 검사하면 검증이 실패해야 한다
        fake = [(1240, 1754, [core.Box(99, 600, 600, 900, 900, "x")])]
        fake += [(0, 0, [])] * (core.pymupdf.open(res["pdf"]).page_count - 1)
        assert core.verify_pdf(res["pdf"], fake), "검증이 덮이지 않은 영역을 못 잡음"
        print("모든 테스트 통과:", os.listdir(res["dir"]))


if __name__ == "__main__":
    main()
