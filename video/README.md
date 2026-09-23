# Promo reels (HyperFrames)

Instagram Reels promos for the site, 1080×1920, silent (music is added in
Instagram). Built with the `product-launch-video` HyperFrames workflow.

| Project | Cut | Length |
| --- | --- | --- |
| `into-dawn-pamphlet/` | A — the site as a concert pamphlet (cover → contents → chapters → back cover) | 19.6s |
| `into-dawn-tour/` | B — the real site on a phone (home → discover → setlist → guide → ticket → end) | 19.2s |

Each project's `BRIEF.md` holds the confirmed brief, `STORYBOARD.md` the frame
plan and change log, `frame.md` the design tokens (the site's own palette and
fonts), `storyboard.html` the approved layout sketches, and
`compositions/frames/` the built frames.

## Not in git

`assets/` (site captures, fonts, the eclipse still — ~25MB per project) and
`renders/` are local only. To rebuild `assets/` on a new machine:

1. Capture the site with the scripts in `scripts/` (Playwright from the repo
   root `node_modules`, mobile 390px @3x, production URL):
   `node video/scripts/sections.mjs <dir>`, `discover.mjs`, `discover2.mjs`,
   `ticket.mjs`, `sky.mjs`, `cap.mjs`. Copy the results into each project's
   `assets/` under the names the frames reference (`screen-*.png`,
   `bg-home-sky.png`).
2. `npx hyperframes capture https://weeknd-goyang-guide.yongveloper.workers.dev -o ./capture`
   inside a project for `loop.mp4`, `intro.mp4`, `poster.webp` and the Bebas
   Neue files; `eclipse-still.jpg` is `ffmpeg -ss 1.5 -i assets/loop.mp4 -frames:v 1 -q:v 2 assets/eclipse-still.jpg`.
3. `python3 video/scripts/build-ko-fonts.py video/into-dawn-pamphlet video/into-dawn-tour`
   for the full Noto Sans KR set.

The captures reflect the production site on the day they are taken, so dates
and copy on screen follow whatever the site shows then.

## Render

```bash
export PATH=$HOME/.nvm/versions/node/v22.14.0/bin:$PATH   # Node 22+
cd video/into-dawn-pamphlet
npx hyperframes check
npx hyperframes render --quality high --output renders/video.mp4
```

After re-running the workflow's `assemble-index.mjs` / `transitions.mjs inject`,
run `python3 video/scripts/post-assemble.py video/<project>` — it sets the
root ground to the site's night black, `lang="ko"`, injects the Noto Sans KR
faces, and keeps hoisted frame videos under their frame.
