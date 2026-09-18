# Cloud light and cohesion refinement — 2026-09-18

The reference calls for different light absorption across exposed caps, partially lit folds and occluded interiors as clouds pass through the eclipse's three-to-seven-o'clock sector. The left bank should read as a connected group rather than several independently drifting sheets.

## Implementation

- `src/scripts/dawn-sky-renderer.ts`: the cover now estimates surface exposure from signed texture relief and two samples toward the stationary right-rim light. Exponential attenuation darkens obstructed folds; exposed caps approach pale gold, while half-light remains amber. A restrained scattering floor preserves intermediate tones.
- The angular direct-light share stays in eclipse coordinates as the cloud texture moves. The existing overall light field and its left-side falloff remain intact.
- Left-bank lobes share the main current, have broader overlapping bodies and fewer small gaps, and replace more of the underlying translucent veil. Local contour deformation continues.
- The independent reading backdrop, eclipse video, title, introduction timing and static reduced-motion/no-WebGL fallback are retained.
- This is a real-time texture-based approximation of volume lighting, not a 3D volumetric simulation or a pixel-identical reproduction of the reference.

## Verification

- Headless Playwright MCP comparison at 1440×1000 and 390×844, with fixed cloud times of 8 and 32 seconds: no page errors or horizontal overflow. Final frames were directly inspected against the reference and original appearance.
- Corrected the first pass's overly pale ridges and insufficient midtones before final inspection.
- Cloud light, shape, continuation and new occlusion regression tests: **13 passed, 3 intentionally skipped** (desktop-only probes).
- The new occlusion test was also run against the original renderer through a separate local test route. It correctly failed because the occluded probe remained too bright (red 163; maximum allowed 78.4).
- Unit tests: **59 passed**. ESLint and Prettier on changed source/test passed. Static build: **7 routes**. Asset budget: **28.4 KiB gzip JavaScript / 75 KiB**, **914.3 KiB raster / 1300 KiB**.
- The full date-sensitive content audit and unrelated full-site E2E suite were not rerun.

Local review: `http://127.0.0.1:4325/`. Comparison captures and original renderer are under ignored `tmp/cloud-relief-review/`; final captures are `final-desktop-8.png`, `final-desktop-32.png`, `final-mobile-8.png`, and `final-mobile-32.png`.

Changes are local; no commit, push or deployment was performed.

## Follow-up: apply the reference's cloud form and texture

The user then asked to apply the detailed visual comparison, including large bodies, medium-sized bulges, broad illuminated faces, and clearer foreground/background occlusion.

- Enlarged the main foreground cloud approximately 28% horizontally and 29% vertically, with a slightly shifted anchor. The left lower bank also uses larger, overlapping photographic lobes.
- Added a restrained five-sample surface filter: 70% original detail and 30% nearby samples. This keeps the photo's grain while reducing thin, disconnected wisps on the enlarged foreground surfaces.
- Decoupled the crop feather from optical density. Dense interiors can become 98.5% opaque, but the crop's feather is never driven through the saturation curve. This avoids revealing smooth crop boundaries.
- Broadened the amber response across the face, using the source relief alongside directional attenuation. Reduced the narrow edge-highlight contribution.
- Attenuated fog and foreground mist over near bodies, leaving more haze between banks and preserving their depth order. Independent reading clouds and static fallbacks retain their previous behavior.
- Inspected desktop and mobile at 8 and 24 seconds. The first pass exposed overly smooth silhouettes; the final pass restored more source detail and preserved the crop feather.
- The new foreground-opacity regression failed against the preceding implementation on both desktop and mobile (no pixels at or above 95% opacity). The revised renderer retains dense cores and soft skirts at both tested wind phases.
- Build, asset budget, changed-file ESLint/Prettier, and Astro check passed. Current aggregate JavaScript is 28.8 KiB gzip; raster size is unchanged at 914.3 KiB.
- Final focused browser suite: **23 passed, 3 intentionally skipped**. Coverage includes foreground opacity, occlusion color, angular light, cloud deformation/reveal, scroll coordinates, reading routes, the clear disk, reduced motion and unavailable WebGL.
- A short local desktop headless rAF sample showed a median 8.3 ms before and after, with p95 9.3/9.2 ms. This is a local scheduling check, not a mobile GPU performance guarantee.

Latest comparison images are in ignored `tmp/cloud-form-review/`. Use `final-desktop-8.png`, `final-desktop-24.png`, `final-mobile-8.png`, and `final-mobile-24.png` for this revision; the earlier `cloud-relief-review` captures are superseded.

## Follow-up: fill lower gaps with varied cloud layers

The user approved the large cloud directly below the eclipse and requested more layers with that texture in the lower empty areas, with varied sizes and a natural rhythm.

- Added three lower lobes using the same `cumulusPlate`, opaque-body response and directional gold/shadow palette. Their relative sizes are 0.80, 0.48 and 0.66 of the main cloud; heights, horizontal positions and proportions differ. The smaller middle lobe is mirrored.
- Positioned the additions near the left edge, left-middle foot and right edge. They share the cover coordinates and slow wind; the main foreground cloud masks the new layers so its approved form stays visible.
- Kept the source crop feather separate from density and sampled light-facing photographic folds without lighting the crop boundary. The first pass's overly bright right-edge strip was corrected before final inspection.
- Integrated the new density with haze occlusion and shaft transmission. The reading-page scene is unaffected.
- Inspected desktop/mobile at 8 and 24 seconds with no page errors. Current captures are in ignored `tmp/cloud-fill-review/final-{desktop,mobile}-{8,24}.png`; these supersede earlier review captures.
- Static build and asset budgets passed: 29.3 KiB aggregate gzip JavaScript and unchanged 914.3 KiB raster assets. No new image download or raster generation was necessary.
- Final focused browser suite: **14 passed, 2 desktop-only probes skipped on mobile**. Astro check, ESLint, Prettier and diff whitespace checks passed.

## Follow-up: annotated placement and layered cloud bodies

The red ellipses specify the centers of three additions with permission to connect into their surroundings. The blue ellipse specifies the existing texture to reuse and a large cloud to divide into two irregular, overlapping layers. The user also requested visible depth throughout the existing and added cover clouds.

- Replaced the rectangular source window with an asymmetric contour made from unequal shoulders and small material-space irregularities. The same photographed texture supplies every new surface; no raster asset was regenerated.
- Split the blue-circled foreground cloud into a higher rear shoulder and a lower, wider front body. Their scales, outlines, offsets and drift differ slightly. Their combined coverage occludes the mist.
- Arranged three differently sized groups around the annotated lower-left, center-left and right positions. Each group has an upper shoulder and a nearer body, and extends beyond its center to overlap adjacent clouds.
- Resolved the existing near/far cloud fields as separately shaded, occluding surfaces. The left bank's smaller foreground lobe also covers its broad rear lobe instead of simply adding luminance. Broad dark troughs, contact shading and reduced haze over dense bodies make depth more legible throughout the cover.
- Directional light still originates at the right eclipse rim, with the established three-to-seven-o'clock falloff. The source crop boundary is excluded from light-gradient samples to prevent artificial bright borders.
- Inspected the reference-like 888×785 viewport, desktop 1440×1000 and mobile 390×844 at 8 and 24 seconds. No page errors or horizontal overflow occurred. Corrected the first pass's weak separation on the left before final inspection. Captures are under ignored `tmp/cloud-layer-review/after-{reference,desktop,mobile}-{8,24}.png`.
- Static build, source ESLint/Prettier, Astro check and whitespace checks passed. Aggregate JavaScript is 30.3 KiB gzip / 75 KiB; raster assets remain 914.3 KiB / 1300 KiB.
- Removed redundant source-surface reads from the shadow calculation by cancelling the surface ratio algebraically, and skip texture samples outside each cloud's coverage. This retains the same shading while limiting the cost of the extra layers.
- The default test browser exceeded the 30-second total budget while taking the seven reveal snapshots. The captured reveal values were advancing correctly; the failure was during screenshot collection. A separate local comparison also found slow scheduling before this revision (150 ms median versus 175 ms after the first optimization). The review Chrome browser's short rAF sample stayed at 8.3 ms median / 9.3 ms p95 before and after. These are local scheduling measurements, not mobile GPU guarantees. Final browser verification allows 60 seconds per test without changing assertions.
- Final browser verification: **23 passed, 3 intentionally skipped desktop-only probes**. This includes dense foreground cores, occlusion color, angular lighting, deformation, reveal timing, scrolling, independent reading surfaces, disk clearance, reduced motion and unavailable WebGL. The six disk/fallback checks passed with the default 30-second limit. No test or project timeout configuration was changed.

## Follow-up: extend adjoining clouds into the two rim gaps

The next annotation requests continuity from the surrounding clouds into the lower-left rim and right-side gaps, using the thinner, translucent folds beneath the eclipse as the reference. The red ellipses indicate destinations, not outlines to reproduce.

- Feathered the existing lower-left shoulder across its former disk-coverage cutoff. Its texture coordinates, grain scale and wind remain continuous with the surrounding cloud; its density falls gradually toward the new skirt.
- Continued the existing right bank upward with its same two source layers, scale and current. A fixed material offset preserves the photographic grain. Low-opacity overlap fades into the existing root, avoiding a separate oval silhouette or a doubled opaque seam.
- Retained the shared light and shadow response, so the right extension naturally receives more rim light than the left. The inner disk and independent reading scene retain their clear boundaries.
- Rejected the first pass's coordinate stretching after visual inspection because it elongated cloud detail. The final approach uses undistorted texture with coverage and opacity transitions.
- Compared before/after frames in headless Chrome at 1644×991 and 390×844, at both 8 and 24 seconds. No page errors or horizontal overflow occurred. Current captures are in ignored `tmp/cloud-extension-review/after-{desktop,mobile}-{8,24}.png`.
- Build, changed-source ESLint/Prettier, asset budgets and diff whitespace checks passed. Aggregate JavaScript is 30.9 KiB gzip / 75 KiB; raster assets are unchanged at 914.3 KiB / 1300 KiB.
- Final focused browser verification: **16 passed, 2 intentionally skipped desktop-only probes**. Coverage includes cloud opacity, directional/occluded lighting, scrolling and reading routes, plus the clear disk on desktop and mobile. Astro check completed with zero errors/warnings and the same two existing hints.

## Follow-up: mobile lower-right cloud and missing concert map

- Added a smaller rear shoulder and a larger front cloud at the lower-right foot, reusing the approved photographic cumulus surface, organic crop, shared wind and directional light/shadow response. Their horizontal anchors are relative to the eclipse, so desktop and mobile keep the same relationship to it. The layers overlap the existing right bank instead of tracing the annotation's oval.
- Inspected before/after at 468×991 and 1644×991, at 8 and 24 seconds. The formerly empty lower-right corner now contains connected, unequal layers without covering the central disk. Captures are in ignored `tmp/cloud-foot-review/after-{mobile,desktop}-{8,24}.png`.
- Reproduced the guide's empty Google iframe in the Codex in-app browser while the same embed displayed in headless Chrome. Eager loading and the observed direct embed URL did not resolve the in-app blank frame; those attempted changes were superseded.
- Replaced the external frame with a locally rendered Leaflet map using OpenStreetMap tiles and the existing directions coordinates (37.6764, 126.7432). It initializes automatically when the map enters view, preserves browser tile caching, displays attribution, and supports labeled zoom controls and a venue marker. No off-screen tile prefetch or location permission is used. Original official access/seat map files and Kakao/Naver/Google directions remain unchanged.
- Verified the real map, venue marker and attribution visually in the user's mobile in-app browser and desktop Chrome. Desktop evidence: ignored `tmp/map-inline-desktop.png`. The map requires tile network access; failures/timeouts show a useful message pointing to the existing local official map and directions. Loading/failed map controls are inert; the local official map and links remain usable without JavaScript.
- Reviewed [Leaflet's official quick start](https://leafletjs.com/examples/quick-start/) and [OSMF tile usage policy](https://operations.osmfoundation.org/policies/tiles/). Automated zoom/error tests use intercepted mock tiles rather than repeated live tile requests.
- Focused desktop/mobile verification: **22 passed**. Coverage includes cloud opacity/light contrast, clear disk, overflow, map auto-load and zoom, failed tile requests, no-JavaScript fallback, original images and directions.
- Build, changed-file ESLint/Prettier, Astro check and asset budget passed. Aggregate JavaScript is **74.6 KiB gzip / 75 KiB** (Leaflet loads only for the visible guide map), raster remains **914.3 KiB / 1300 KiB**. The aggregate JavaScript budget has little remaining headroom. Astro reports zero errors/warnings and the same two pre-existing hints. No factual content audit, unrelated full suite, commit or deployment was performed.

## Follow-up: stronger rim clouds and full-screen grain

- Increased final cloud opacity by a relative 30% at the two annotated rim-extension centers, with the existing soft spatial falloff into adjacent banks. Alpha is capped at one and premultiplied color scales with it. No new oval boundary or texture stretch is introduced.
- Moved the existing monochrome grain tile into one fixed, non-interactive layer covering the entire viewport, including reading and share routes. Intensities increase by a relative 15%: cover 0.21735 → 0.2499525, other routes 0.18 → 0.207. Removed the former background-only duplicate.
- Inspected final desktop 1644×991 and mobile 468×991 frames in headless Chrome. Existing cloud folds, eclipse-relative position and connection to the banks remain visible; no page errors or horizontal overflow occurred. Final frames are under ignored `tmp/final-art-review/after-{desktop,mobile}-8.png`.
- The supplied ticket/poster artwork and original downloads are documented separately in `docs/share-art-direction.md`.
- Latest focused desktop/mobile suite: **81 passed, one intentionally skipped mobile-only test on desktop**. It covers cloud cores and shadow, full-screen grain, guide navigation, map behavior/failure/no-JS fallback, ticket/poster JPEG export, native sharing/cancellation, clipboard fallback, keyboard interaction and absence of submitted/stored selections.
- Unit tests: **60 passed**. ESLint, formatting and Astro check passed (zero errors/warnings, two existing hints). Build and budget passed: **74.0 KiB gzip JavaScript / 75 KiB**, **1221.6 KiB page raster / 1300 KiB**, **6541.6 KiB explicit original downloads / 8192 KiB**.
- The existing content freshness audit still reports 16 stale-content/source findings across eight practical guides (27 audit tests pass, one fails). No source-verification dates were altered. Full release verification is therefore not claimed as passing; upload is to the existing draft review PR.
- Final additional checks: **14 passed**, covering disk clearance, reduced motion, unavailable WebGL, share-route accessibility and keyboard/text-zoom layouts. Combined current browser verification is **95 passed, one intentional skip**. Cloudflare static-assets dry run also passed; it did not publish the site.
