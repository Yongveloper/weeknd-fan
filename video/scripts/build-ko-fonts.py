"""Stage the full Noto Sans KR variable font (all unicode-range subsets) into a
HyperFrames project and write assets/fonts/noto-sans-kr.css for post-assemble.py.

The site capture only ships the handful of subsets its own pages load, so most
Hangul would fall back to a system font in the render.

  python3 video/scripts/build-ko-fonts.py video/into-dawn-pamphlet video/into-dawn-tour
"""
import pathlib
import re
import shutil
import sys

SRC = pathlib.Path(__file__).resolve().parents[2] / "node_modules/@fontsource-variable/noto-sans-kr"

css = (SRC / "index.css").read_text()
rules = []
for block in re.findall(r"@font-face\s*\{[^}]*\}", css):
    src = re.search(r"url\(\./files/([^)]+\.woff2)\)", block)
    rng = re.search(r"unicode-range:\s*([^;]+);", block)
    if not src:
        continue
    rules.append(
        '@font-face{font-family:"Noto Sans KR";font-style:normal;font-display:block;'
        'font-weight:100 900;src:url("assets/fonts/noto-sans-kr/%s") format("woff2");%s}'
        % (src.group(1), "unicode-range:%s;" % rng.group(1).strip() if rng else "")
    )

for project in sys.argv[1:]:
    out = pathlib.Path(project, "assets/fonts/noto-sans-kr")
    out.mkdir(parents=True, exist_ok=True)
    for f in (SRC / "files").glob("*.woff2"):
        shutil.copy(f, out / f.name)
    pathlib.Path(project, "assets/fonts/noto-sans-kr.css").write_text("\n".join(rules) + "\n")
    print(project, len(rules), "faces")
