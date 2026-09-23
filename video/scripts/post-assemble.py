import re,sys,pathlib
for proj in sys.argv[1:]:
    p=pathlib.Path(proj,'index.html'); s=p.read_text()
    s=s.replace('<html lang="en">','<html lang="ko">',1)
    s=s.replace('background: #F1EEE7;','background: #0B0B0A;',1)
    css=pathlib.Path(proj,'assets/fonts/noto-sans-kr.css').read_text()
    marker='<!-- noto-sans-kr full subsets -->'
    if marker not in s:
        s=s.replace('    <style>','    '+marker+'\n    <style>\n'+css+'    </style>\n    <style>',1)
    # hoisted frame videos paint after every scene wrapper; keep them under the frame that owns them
    import re
    for vid in re.findall(r'<video id="el-([0-9a-z-]+?)-video-\d+"', s):
        rule = f'#el-{vid}{{z-index:1}}'
        if rule not in s:
            s = s.replace('      .scene {', f'      {rule}\n      .scene {{', 1)
    # Studio draws one row per data-track-index: give every scene host its own
    # row (display only; stacking is CSS) and mark it as graphics.
    hosts = [m for m in re.finditer(r'<div\b[^>]*\bclass="scene"[^>]*>', s)]
    for i, m in reversed(list(enumerate(hosts))):
        tag = re.sub(r'data-track-index="\d+"', 'data-track-index="%d"' % i, m.group(0))
        if 'data-track-kind' not in tag:
            tag = tag.replace('class="scene"', 'class="scene" data-track-kind="graphics"', 1)
        s = s[:m.start()] + tag + s[m.end():]
    p.write_text(s)
    print(proj, 'root bg', '#0B0B0A' in s, 'fonts', s.count('noto-sans-kr/'))
