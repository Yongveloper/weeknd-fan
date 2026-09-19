import { transform } from 'motion';

export interface DawnRenderer {
  setPlaying(playing: boolean): void;
  dispose(): void;
}

// One second of darkness, followed by a clamped, three-second linear reveal.
const REVEAL_DARK_MS = 1000;
const cloudRevealAt = transform([REVEAL_DARK_MS, 4000], [0, 1]);

const vertex = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

// Texture detail provides the cloud forms; slow domain warping makes their
// edges evolve instead of sliding a flat picture across the screen.
const fragment = `
precision highp float;
uniform vec2 resolution;
uniform vec3 sceneFrame;
uniform float scrollOffset;
uniform float readingOnly;
uniform float time;
uniform float dawn;
uniform float cloudReveal;
uniform float desktopAtmosphere;
uniform vec3 eclipse;
uniform vec2 cloudOrigin;
uniform sampler2D clouds;
uniform sampler2D titleEmission;
uniform float titleEnergy;
uniform vec3 titleColor;
// RGB ratios sampled separately from the approved v8 loop: orange outer
// corona, pale gold inner glow, and the near-white emitting rim. Normalize
// each to red = 1 so the existing spatial light field still controls energy.
const vec3 coronaOrange = vec3(1.0,0.582,0.299);
const vec3 coronaGold = vec3(1.0,0.760,0.514);
const vec3 rimIvory = vec3(1.0,0.968,0.935);

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p) {
  float n = 0.0, a = 0.5;
  for (int i=0; i<4; i++) {
    n += a*noise(p); p = mat2(1.6,-1.2,1.2,1.6)*p+2.7; a *= 0.5;
  }
  return n;
}
float plate(vec2 p) {
  vec3 c = texture2D(clouds, clamp(p, 0.001, 0.999)).rgb;
  float edge = smoothstep(0.0,0.12,p.x)*smoothstep(0.0,0.12,1.0-p.x)
             *smoothstep(0.0,0.15,p.y)*smoothstep(0.0,0.12,1.0-p.y);
  // A shaded cloud is still a body, not a hole. Recover its middle-density
  // folds instead of using the photo's illumination as literal opacity.
  // The plate-wide normalization retains its original integrated density;
  // edge fades, distributed gaps and eclipse attenuation are applied later.
  float body = pow(dot(c,vec3(0.3,0.5,0.2)),0.72)*0.6714321;
  return body*edge;
}
// The four base currents travel at 0.00728 cover-heights / second (20% slower). Different
// phases and handedness change direction, never the speed of a cloud group.
vec2 wind(float phase, float handedness) {
  float angle = time*0.112*handedness+phase;
  return (vec2(cos(angle),sin(angle))-vec2(cos(phase),sin(phase)))*0.065;
}
// A radius-dependent twist moves cloud lobes around a local center. It is
// area-preserving in polar coordinates: r stays fixed, only theta changes.
vec2 cloudCurl(vec2 p, vec2 center, float radius, float turn) {
  vec2 q = p-center;
  float weight = 1.0-smoothstep(0.0,radius,length(q));
  float angle = turn*weight;
  float c = cos(angle), s = sin(angle);
  return center+vec2(c*q.x-s*q.y,s*q.x+c*q.y);
}
// Nested regions contain a large bank, medium clumps or small wisps. Each
// has its own cohesion and folding phase, rather than one repeated curl.
// Every local map stays inside its cell and preserves area/density.
vec2 deformCloud(vec2 p) {
  float evolution = time*0.8;
  vec2 region = floor(p*2.15);
  float family = hash(region+vec2(2.7,6.3));
  float divisions = 1.0+step(0.34,family)+step(0.73,family);
  vec2 cell = floor(fract(p*2.15)*divisions);
  vec2 center = (region+(cell+0.5)/divisions)/2.15;
  float character = fract(family*13.71+dot(cell,vec2(0.37,0.61)));
  float loose = smoothstep(0.45,0.88,character);
  float phase = character*6.2831853;
  float rate = mix(0.14,0.27,family);
  float turn = (sin(evolution*rate+phase)-sin(phase))*mix(0.16,0.85,loose);
  // Conjugating the curl by an elliptical transform stretches loose
  // edges into wisps while compact groups retain their core. The inverse
  // transform cancels its area change; no opacity/volume pulse is added.
  vec2 stretch = vec2(mix(1.0,1.30,loose),1.0);
  p = center+cloudCurl((p-center)*stretch,vec2(0.0),0.46/(2.15*divisions),turn)/stretch;
  // Broad folds evolve without shredding rounded lobes into smoke threads.
  // Sequential shears still preserve area, with no density/volume pulse.
  p.x += (sin(p.y*13.0+evolution*0.27)-sin(p.y*13.0))*0.010;
  p.y += (sin(p.x*17.0-evolution*0.24+1.7)-sin(p.x*17.0+1.7))*0.009;
  return p;
}
// Broad coherent banks contain smaller interleaved pockets. Both currents
// keep complementary weights, so subdivision does not add cloud density.
float cloudGroups(vec2 p) {
  float broad = noise(p*0.52);
  float pockets = noise(p*1.75+vec2(5.3,2.1));
  return smoothstep(0.28,0.72,mix(broad,pockets,0.38));
}
// Soft pockets occupy about 15% of the cloud field, distributed across
// staggered cells. Variable widths/heights avoid a single opening or stripe.
float cloudGaps(vec2 p) {
  vec2 grid = p*vec2(7.0,5.0);
  grid.x += floor(grid.y)*0.37;
  vec2 cell = floor(grid);
  float seed = hash(cell+vec2(3.4,9.2));
  vec2 center = vec2(0.5)+vec2(seed-0.5,fract(seed*7.13)-0.5)*0.10;
  vec2 radius = vec2(mix(0.29,0.43,seed),mix(0.38,0.30,seed));
  float pocket = 1.0-smoothstep(0.18,1.0,length((fract(grid)-center)/radius));
  return pocket;
}
float spacedPlate(vec2 p, float gapZone) {
  p = deformCloud(p);
  // Even the thinnest point retains 40% of its cloud texture. The pockets
  // share its exact deformation/drift, including the light-blocking sample.
  return plate(p)*(1.0-0.60*gapZone*cloudGaps(p));
}
float groupedPlate(vec2 p, vec2 a, vec2 b, float blend, float gapZone) {
  return mix(spacedPlate(p+a,gapZone),spacedPlate(p+b,gapZone),blend);
}
// Broad bodies and smaller breaks are attached to the moving cloud domains.
// They change optical thickness, not the wind, outline or phase of a group.
float cloudCohesion(vec2 p) {
  p = deformCloud(p);
  float bank = noise(p*vec2(4.8,3.5)+vec2(2.7,7.1));
  float lobes = noise(p*vec2(11.7,8.4)+vec2(8.3,1.9));
  return smoothstep(0.30,0.62,bank*0.72+lobes*0.28);
}
float bodyOpacity(float body, float cohesion) {
  // Opacity describes the body, not the exposure in the source photograph.
  // Mid-dark folds join the opaque core; only its outer skirt transmits sky.
  float skirt = smoothstep(0.025,0.20,body)*mix(0.55,0.95,cohesion);
  float core = smoothstep(0.08,0.23,body)*smoothstep(0.30,0.60,cohesion);
  return min(0.985,max(skirt,core));
}
// Recover the medium-scale rounded surface beneath the photo's fine wisps.
// The original contour and some fine grain remain, with no procedural blobs.
float roundedPlate(vec2 p) {
  vec2 stepSize = vec2(0.004,0.006);
  return plate(p)*0.70
       +(plate(p+vec2(stepSize.x,0.0))+plate(p-vec2(stepSize.x,0.0))
        +plate(p+vec2(0.0,stepSize.y))+plate(p-vec2(0.0,stepSize.y)))*0.075;
}
// The replacement bank uses one compact, rounded lobe family from the photo.
// Enlarging that smaller source region produces fewer, fuller cloud folds.
// All deformation still conserves area and has no opacity/volume pulse.
float cumulusCrop(vec2 p) {
  vec2 q = (p-vec2(0.23,0.63))/vec2(0.17,0.1942857);
  // Unequal, overlapping shoulders replace the rectangular source window.
  // The contour follows the same material coordinates as the photo's folds.
  float body = length((q-vec2(-0.08,0.22))/vec2(0.96,0.82));
  float shoulder = length((q-vec2(-0.36,-0.22))/vec2(0.60,0.74));
  float crown = length((q-vec2(0.34,-0.14))/vec2(0.65,0.55));
  float contour = min(body,min(shoulder,crown));
  contour += (noise(q*5.3+vec2(7.1,2.8))-0.5)*0.13;
  contour += (noise(q*13.0+vec2(1.3,6.2))-0.5)*0.045;
  return 1.0-smoothstep(0.70,1.02,contour);
}
float cumulusPlate(vec2 p) {
  p = deformCloud(p);
  float envelope = cumulusCrop(p);
  if (envelope == 0.0) return 0.0;
  return pow(roundedPlate(p),0.85)*1.25*envelope;
}
// The crop supplies coverage only. Lighting differentiates the photographic
// surface so an artificial cut edge can never become a glowing square rim.
float cumulusShadow(vec2 p, vec2 lightStep, float envelope) {
  if (envelope == 0.0) return 0.0;
  // Reuse the already sampled coverage. The source-surface ratio cancels
  // algebraically, avoiding five redundant texture reads per shadow sample.
  return pow(roundedPlate(deformCloud(p+lightStep)),0.85)*1.25*envelope;
}
// Overlapping, seeded rows extend the same texture into the reading area.
// Edge-faded rows wrap independently; no image is elongated on scroll.
float continuedPlate(vec2 p) {
  float row = floor(p.y);
  vec2 q = vec2(p.x,fract(p.y));
  q.x += (hash(vec2(row,4.7))-0.5)*0.12;
  q.x = mix(q.x,1.0-q.x,step(0.5,hash(vec2(row,8.3))));
  return plate(q)*(1.0-0.60*cloudGaps(q));
}
float continuedGroups(vec2 p, vec2 a, vec2 b, float blend) {
  return mix(continuedPlate(deformCloud(p+a)),continuedPlate(deformCloud(p+b)),blend);
}
// Every cloud surface uses this same shadow, gold body and light-facing edge.
// The foreground bank changes density and form, never its lighting palette.
vec3 litCloudColor(float detail, float litEdge, float blocked, float pathBlocked,
                   float illumination, float reach, float directShare,
                   vec3 shadowColor, float volume) {
  // Preserve the reading sky's existing diffuse response. The cover below
  // resolves this energy into exposed caps, half-lit folds and deep shade.
  float bodyShade = mix(0.70,1.0,smoothstep(0.025,0.24,detail));
  vec3 color = shadowColor*(0.65+detail);
  color += coronaOrange*illumination*(0.08+reach*0.95)*(0.15+detail)*bodyShade;
  color += mix(coronaGold,rimIvory,reach*0.7)*illumination*litEdge*(0.12+reach*0.95)*(0.12+detail);
  color += coronaGold*desktopAtmosphere*illumination
           *(0.045+reach*0.26)*sqrt(clamp(detail,0.0,1.0))*bodyShade;
  // Signed relief distinguishes an exposed cap from its lee-facing fold.
  // A second, farther sample catches a lobe shadowing another lobe. All
  // samples follow the same moving domain, but point toward the fixed sun.
  float relief = (detail-blocked)/max(0.06,detail+blocked);
  float cap = smoothstep(-0.20,0.40,relief);
  float fold = smoothstep(0.02,0.32,-relief);
  float opticalDepth = max(0.0,blocked-detail*0.60)*4.8
                     +max(0.0,pathBlocked-detail*0.45)*2.6;
  float transmission = exp(-opticalDepth);
  float direct = illumination*directShare*transmission;
  float surfaceLight = sqrt(max(0.0,illumination))*(0.32+directShare*0.68)*sqrt(transmission);
  float bounce = illumination*(0.10+0.12*(1.0-directShare));
  // The dense interior remains a dark surface rather than becoming a hole.
  // Orange survives in half-light; only unoccluded caps approach ivory.
  vec3 shaded = shadowColor*(0.48+detail*0.72)*(1.0-fold*0.38);
  shaded += coronaOrange*bounce*(0.09+detail*0.28)*(1.0-fold*0.45);
  vec3 bodyTint = mix(coronaOrange,coronaGold,cap*transmission*0.75);
  // Light occupies the curved face as well as its rim. A longer scattering
  // falloff makes broad amber half-tones before the fully occluded fold.
  float face = pow(clamp(detail*3.4,0.0,1.0),1.2);
  shaded += bodyTint*surfaceLight*(0.40+reach*0.60)
           *(0.06+face*0.90)*mix(0.62,1.10,cap);
  float silver = cap*transmission*smoothstep(0.28,0.90,directShare);
  shaded += mix(coronaGold,rimIvory,silver*0.50)*direct
           *(litEdge*0.65+cap*detail*0.52)*(0.32+reach*0.95);
  // Keep broad dark troughs between lit terraces at every cloud depth.
  // This responds to the source surface, not a fixed screen-space stripe.
  shaded *= mix(0.72,1.12,smoothstep(0.055,0.32,detail));
  // A small multiple-scattering floor keeps the warm half-tones readable
  // between the bright caps and deep folds, especially beyond seven o'clock.
  shaded = mix(color,shaded,0.82);
  // Reading surfaces retain their existing quieter illumination.
  return mix(color,shaded,volume);
}
float mistPlate(vec2 p) {
  p = deformCloud(p);
  float body = fbm(p*3.2+vec2(4.1,7.3));
  float wisps = fbm(p*10.0+vec2(body*1.4,-body*0.8));
  if (desktopAtmosphere > 0.5) {
    float filaments = fbm(p*18.0+vec2(wisps*2.0,-body));
    return smoothstep(0.23,0.72,body*0.52+wisps*0.32+filaments*0.16);
  }
  return smoothstep(0.18,0.70,body*0.68+wisps*0.32);
}
void main() {
  vec2 viewportUV = gl_FragCoord.xy / resolution;
  viewportUV.y = 1.0-viewportUV.y;
  // Extend above/below the cover without stretching its existing composition.
  vec2 screenUV = vec2(viewportUV.x,viewportUV.y*sceneFrame.y-sceneFrame.z);
  float worldY = screenUV.y+scrollOffset;
  // The cover is one document scene: eclipse, clouds and mist translate
  // together. Only the separate reading backdrop stays in viewport space.
  float readingMask = max(readingOnly,smoothstep(1.0,1.15,worldY));
  // Never interpolate texture coordinates across the join: blend the two
  // independently sampled densities below so neither scene stretches.
  vec2 uv = vec2(screenUV.x,worldY);
  vec2 atmosphereUV = mix(uv,viewportUV,readingMask);
  float aspect = sceneFrame.x;
  float mobile = 1.0-step(0.95,aspect);
  vec2 point = vec2(uv.x*aspect,uv.y);
  vec2 center = eclipse.xy;
  float radius = eclipse.z;
  vec2 relative = point-center;
  float radialDistance = length(relative)/radius;
  // Continue the adjoining banks into the two rim gaps. These broad fields
  // feather existing material; they never draw a separate oval cloud.
  vec2 rimSide = relative/radius;
  float leftExtension = smoothstep(-1.60,-1.10,rimSide.x)
                      *(1.0-smoothstep(-0.88,-0.48,rimSide.x))
                      *smoothstep(0.18,0.42,rimSide.y)
                      *(1.0-smoothstep(0.72,1.10,rimSide.y))
                      *smoothstep(0.78,0.95,radialDistance)*(1.0-readingMask);
  float rightExtension = smoothstep(0.82,1.05,rimSide.x)
                       *(1.0-smoothstep(1.35,1.85,rimSide.x))
                       *smoothstep(-0.32,0.12,rimSide.y)
                       *(1.0-smoothstep(0.28,1.20,rimSide.y))*(1.0-readingMask);
  // The extended skirts retain the blue reference's translucent folds.
  // A gradual density change reads as cloud thickness, not a pasted seam.
  float extensionDensity = 1.0-leftExtension*0.22;
  // Keep the established layout warp static; only the area-preserving
  // flow above evolves, avoiding expansion/contraction of whole banks.
  float turbulence = fbm(point*3.0);
  vec2 warp = vec2(turbulence-0.5,noise(point*5.0)-0.5)*0.035;
  vec2 cloudUV = uv;
  cloudUV.x = mix(uv.x,uv.x*0.56+0.27,mobile);
  // Cover-local coordinates preserve the composition while it scrolls away.
  vec2 uvPerStage = vec2(mix(1.0,0.56,mobile)/aspect,1.0);
  vec2 windA = wind(0.25,1.0);
  vec2 windB = wind(2.20,-1.0);
  vec2 windC = wind(3.90,1.0);
  vec2 windD = wind(5.50,-1.0);
  // Soft irregular pockets split broad banks into several interleaved groups.
  float nearMix = cloudGroups(point*vec2(4.1,3.3)+vec2(2.1,8.7));
  float farMix = cloudGroups(point*vec2(3.7,4.2)+vec2(7.4,1.2));
  // On the left, several lobes belong to one bank. Their main current is
  // shared; local deformation still rolls their edges without separating
  // them into counter-moving sheets. Reading clouds keep their own flow.
  float leftGroup = (1.0-smoothstep(center.x-radius*0.95,center.x-radius*0.15,point.x))
                  *(1.0-readingMask);
  nearMix *= 1.0-leftGroup*0.94;
  farMix *= 1.0-leftGroup*0.94;
  vec2 nearScale = vec2(0.8,0.83);
  vec2 farScale = vec2(0.88,0.95);
  vec2 nearA = windA*uvPerStage*nearScale;
  vec2 nearB = windB*uvPerStage*nearScale;
  vec2 farA = mix(windC,windA,leftGroup)*uvPerStage*farScale;
  vec2 farB = windD*uvPerStage*farScale;
  vec2 farUV = cloudUV*farScale+vec2(0.03,0.005)+warp;
  vec2 nearUV = cloudUV*nearScale+vec2(0.13,0.08)-warp*0.7;
  // An independent viewport field supplies the boards, on home and all
  // reading routes. It has its own seed/rows, with the cover's wind and grain.
  float readingY = viewportUV.y*sceneFrame.y;
  vec2 readingPoint = vec2(point.x,readingY+2.7);
  float readingNearMix = cloudGroups(readingPoint*vec2(4.1,3.3)+vec2(2.1,8.7));
  float readingFarMix = cloudGroups(readingPoint*vec2(3.7,4.2)+vec2(7.4,1.2));
  vec2 readingWarp = vec2(noise(readingPoint*3.0)-0.5,noise(readingPoint*5.0)-0.5)*0.07;
  vec2 readingNearUV = vec2(cloudUV.x*nearScale.x+0.13,readingY*nearScale.y+2.48)-readingWarp;
  vec2 readingFarUV = vec2(cloudUV.x*farScale.x+0.03,readingY*farScale.y+2.98)+readingWarp;
  // Preserve the moving texture, but route dense banks around the disk.
  // A soft opening keeps the disk clear. The lower-left shoulder can now
  // feather across its adjacent rim, with the bottom bank's thin texture.
  float opening = smoothstep(0.93,1.24,radialDistance+(turbulence-0.5)*0.10);
  float lowerBank = smoothstep(0.30,1.02,relative.y/radius+(turbulence-0.5)*0.18)*0.82;
  if (desktopAtmosphere > 0.5) {
    // The lower 20% of the disk starts at center + 0.6 × radius.
    // Keep that boundary independent of turbulence and wind.
    lowerBank = smoothstep(0.60,0.94,relative.y/radius)*0.88;
  }
  float coverage = mix(max(max(opening,lowerBank),leftExtension*0.60),1.0,readingMask);
  // Thin only cloud surfaces crossing the lower disk. Feather the boundary
  // entirely inside the circle, leaving every outside cloud and mist intact.
  float overlapStart = mix(0.30,0.60,desktopAtmosphere);
  float diskOverlap = smoothstep(overlapStart,overlapStart+0.12,relative.y/radius)
                    *(1.0-smoothstep(0.92,1.0,radialDistance))*(1.0-readingMask);
  // These broad, irregular pockets travel and fold with the two near-cloud
  // currents. No independent opacity pulse or fixed screen-space spots.
  float overlapPockets = mix(
    noise(deformCloud(nearUV+nearA)*vec2(17.1,13.3)+vec2(2.4,5.7)),
    noise(deformCloud(nearUV+nearB)*vec2(17.1,13.3)+vec2(2.4,5.7)),nearMix);
  float overlapReduction = mix(0.10,0.30,smoothstep(0.30,0.70,overlapPockets));
  float overlapOpacity = 1.0-diskOverlap*overlapReduction;
  // Thin the combined lower cover once, preserving its shapes and mist.
  // The feathered transition leaves the independent reading sky untouched.
  float lowerCloudOpacity = 1.0-0.10*smoothstep(0.55,0.75,uv.y)*(1.0-readingMask);
  float cloudOpacity = overlapOpacity*lowerCloudOpacity*extensionDensity;
  float gapZone = smoothstep(0.55,0.78,uv.y)*(1.0-leftGroup*0.80);
  float farCloud = groupedPlate(farUV,farA,farB,farMix,gapZone)*coverage;
  float nearCloud = groupedPlate(nearUV,nearA,nearB,nearMix,gapZone)*coverage;
  // Anchor the bank to the original cover composition within the shared
  // cloud field. Light, occlusion and texture share the cover coordinates.
  vec2 bankRelative = vec2(cloudUV.x*aspect,cloudUV.y)-cloudOrigin;
  // Convert shared wind through each texture's scale so both banks travel
  // the same screen distance, with the same direction and reversal timing.
  vec2 bankScale = vec2(mix(1.0,0.56,mobile)*0.34,0.72)/radius;
  vec2 bankA = windA*bankScale;
  vec2 bankB = windB*bankScale;
  vec2 bankUV = vec2(bankRelative.x/radius*0.34+0.48,
                    (bankRelative.y/radius-0.92)*0.72+0.66)-warp*0.3;
  const float bankAmount = 0.8;
  float bankWindow = 0.0;
  float bankCloud = 0.0;
  float footWindow = 0.0;
  vec2 footUV = bankUV+vec2(0.10,-0.42);
  if (desktopAtmosphere > 0.5) {
    // Broad, uneven hollows break up the bank without changing its fine
    // texture or lighting. They travel with the same warped cloud field.
    float hollow = smoothstep(0.28,0.72,
      noise((bankUV+mix(bankA,bankB,nearMix))*vec2(6.4,1.7)+vec2(1.8,4.6)));
    float crest = 0.60+hollow*0.24;
    bankWindow = smoothstep(crest,crest+0.18,bankRelative.y/radius)
               *(1.0-smoothstep(1.55,2.16,bankRelative.y/radius))
               *(1.0-smoothstep(0.90,1.85,abs(bankRelative.x/radius+0.03)));
    bankWindow *= 1.0-hollow*0.40;
    bankCloud = groupedPlate(bankUV,bankA,bankB,nearMix,gapZone)*bankWindow*bankAmount;
    // Fill the lower gap between seven and six o'clock with the same
    // cloud plate and currents. The extra lobes stay below the disk and
    // belong to the same cover scene as the eclipse.
    float footAngle = atan(bankRelative.x,bankRelative.y);
    footWindow = smoothstep(1.04,1.44,bankRelative.y/radius)
               *(1.0-smoothstep(1.12,1.38,uv.y))
               *smoothstep(-0.72,-0.51,footAngle)
               *(1.0-smoothstep(0.02,0.20,footAngle));
    footWindow *= 0.55+0.45*hollow;
    bankCloud += groupedPlate(footUV,bankA,bankB,nearMix,gapZone)*footWindow*0.55;
    nearCloud += bankCloud*1.08;
  }
  // One large foreground mass carries medium lobes and smaller surface
  // folds. Its scale and depth differ from the distant fine cloud bank.
  vec2 cumulusCenter = vec2(center.x-radius*mix(0.90,0.55,mobile),0.93);
  vec2 cumulusScale = vec2(0.148,0.22)/radius;
  vec2 frontScale = cumulusScale*vec2(1.16,1.20);
  vec2 cumulusUV = (point-cumulusCenter)*frontScale+vec2(0.23,0.63);
  vec2 cumulusWind = windA*frontScale;
  float cumulusEnvelope = cumulusCrop(deformCloud(cumulusUV+cumulusWind));
  float cumulusCloud = cumulusPlate(cumulusUV+cumulusWind);
  // The former single block becomes two banks at different heights/depths.
  // The upper shoulder emerges behind the wider, lower foreground body.
  vec2 rearCenter = cumulusCenter+vec2(radius*0.48,-0.125);
  vec2 rearScale = cumulusScale*vec2(-1.48,1.36);
  vec2 rearUV = (point-rearCenter+mix(windA,windC,0.12))*rearScale+vec2(0.23,0.63);
  float rearEnvelope = cumulusCrop(deformCloud(rearUV));
  float rearCloud = cumulusPlate(rearUV);
  // New lower-page clouds replace only the region behind the reading panels.
  // Cover clouds leave with the hero; these independent clouds are not pulled along.
  if (readingMask > 0.0) {
    nearCloud = mix(nearCloud,continuedGroups(readingNearUV,nearA,nearB,readingNearMix)*0.90,readingMask);
    farCloud = mix(farCloud,continuedGroups(readingFarUV,farA,farB,readingFarMix)*0.80,readingMask);
  }
  float fogBody = mix(fbm((point+windC)*2.6),fbm((point+windD)*2.6),farMix);
  if (readingMask > 0.0) {
    float lowerFog = mix(fbm((readingPoint+windC)*2.6),fbm((readingPoint+windD)*2.6),readingFarMix);
    fogBody = mix(fogBody,lowerFog,readingMask);
  }
  float fog = smoothstep(0.33,0.85,fogBody);
  fog *= smoothstep(0.12,0.95,atmosphereUV.y);

  // Only atmosphere is rendered here. The unmodified v8 video below this
  // transparent canvas supplies the eclipse, its corona and its reveal.
  // The cached outline mask stays with the letters while cloud density moves
  // through it. Light follows the DOM reveal, then holds the same full intensity.
  vec2 titleMask = texture2D(titleEmission,viewportUV).rg;
  // Increase the existing reflected light by 10%, matching the CSS corona.
  // Letter-face clearance and the arrival clock remain independent.
  float titleLight = titleMask.r*titleEnergy*0.88;
  vec3 titleGold = titleColor;
  // The brightest point of v8 is on the right rim. All scattering and
  // surface highlights originate there, rather than in the disk's center.
  // The sun leaves with the cover. The independent reading scene keeps
  // an offscreen light source with the same golden angular falloff.
  vec2 lightCenter = mix(center,vec2(center.x,-radius*0.15),readingMask);
  vec2 lightPoint = vec2(point.x,mix(point.y,screenUV.y,readingMask));
  vec2 lightRelative = lightPoint-lightCenter;
  vec2 lightOrigin = lightCenter+vec2(0.985,0.07)*radius;
  vec2 fromLight = lightPoint-lightOrigin;
  float lightDistance = length(fromLight);
  float reach = exp(-lightDistance*1.65);
  // Lighting lives in eclipse space, not in the moving cloud texture.
  // Down is six o'clock, +PI/6 is five, -PI/6 is seven. Direct golden
  // light still fades beyond seven; scattered light keeps the left visible.
  float clockAngle = atan(lightRelative.x,lightRelative.y);
  float facing = lightRelative.x/max(length(lightRelative),0.0001);
  float rimEmission = pow(clamp((facing+0.30)/1.30,0.0,1.0),1.6);
  float lowerFan = exp(-pow((clockAngle-0.20)/0.68,2.0))
                 *smoothstep(0.0,0.45,lightRelative.y/radius);
  float sevenOclockFalloff = smoothstep(-1.0471976,-0.5235988,clockAngle);
  float directField = max(rimEmission,lowerFan*0.98)*sevenOclockFalloff;
  // Reference the existing six-o'clock light at this height. A continuous
  // screen-space ramp gives the far left 10% and six o'clock 100%, without
  // changing the bright right rim or the established six-o'clock maximum.
  float sixField = max(pow(0.30/1.30,1.6),
    exp(-pow(0.20/0.68,2.0))*0.98*smoothstep(0.0,0.45,lightRelative.y/radius));
  float sixReach = exp(-length(vec2(radius*0.985,lightRelative.y-radius*0.07))*1.65);
  float leftRamp = mix(0.10,1.0,smoothstep(0.0,lightCenter.x,point.x));
  float scatteredLight = sixField*(1.0+desktopAtmosphere*sixReach*0.35)*leftRamp;
  float directLight = directField*(1.0+desktopAtmosphere*reach*0.35);
  float illumination = dawn*mix(scatteredLight,directLight,step(lightCenter.x,point.x));
  // Lift the lower cover's cloud surfaces, not their opacity or light hue.
  // Project the seven-o'clock ray to the cover foot: +10% at the left edge,
  // +15% there, then feather back into the unchanged six-o'clock light.
  float sevenFootX = max(0.001,center.x-(1.0-center.y)*0.5773503);
  float lowerLift = smoothstep(center.y+radius*0.60,center.y+radius*1.10,point.y);
  float leftLift = mix(0.10,0.15,smoothstep(0.0,sevenFootX,point.x))
                 *(1.0-smoothstep(sevenFootX,center.x,point.x));
  float cloudBrightness = 1.0+leftLift*lowerLift*(1.0-readingMask);
  // The soft join straddles the visible left rim; there is no rectangular
  // grading boundary where these clouds meet the bank below the eclipse.
  float leftRelief = smoothstep(center.y+radius*0.35,center.y+radius*0.90,point.y)
                   *(1.0-smoothstep(center.x-radius*1.20,center.x-radius*0.60,point.x))
                   *(1.0-readingMask);
  // Uncover the existing shoulder's thin skirt at the lower-left rim.
  // Its material coordinates and grain scale remain continuous with its root.
  float bodyWindow = leftRelief*max(smoothstep(1.0,1.10,radialDistance),leftExtension*0.35);
  vec2 towardLight = normalize(vec2(-fromLight.x/aspect,-fromLight.y)+0.0001);
  towardLight.x *= mix(1.0,0.56,mobile);
  float nearBlocker = groupedPlate(nearUV+towardLight*0.065,nearA,nearB,nearMix,gapZone)*coverage;
  float farBlocker = groupedPlate(farUV+towardLight*0.045,farA,farB,farMix,gapZone)*coverage;
  float nearPathBlocker = nearBlocker;
  float farPathBlocker = farBlocker;
  if (readingMask < 1.0) {
    nearPathBlocker = groupedPlate(nearUV+towardLight*0.14,nearA,nearB,nearMix,gapZone)*coverage;
    farPathBlocker = groupedPlate(farUV+towardLight*0.10,farA,farB,farMix,gapZone)*coverage;
  }
  float bankBlocker = 0.0;
  if (desktopAtmosphere > 0.5) {
    bankBlocker = groupedPlate(bankUV+towardLight*0.085,bankA,bankB,nearMix,gapZone)*bankWindow*bankAmount;
    bankBlocker += groupedPlate(footUV+towardLight*0.085,bankA,bankB,nearMix,gapZone)*footWindow*0.55;
    nearBlocker += bankBlocker*1.08;
  }
  vec2 cumulusTowardLight = normalize(-fromLight+0.0001)*frontScale*radius*0.12;
  float cumulusBlocker = cumulusShadow(cumulusUV+cumulusWind,cumulusTowardLight,cumulusEnvelope);
  float cumulusPathBlocker = cumulusShadow(cumulusUV+cumulusWind,cumulusTowardLight*2.2,cumulusEnvelope);
  nearBlocker += cumulusBlocker*coverage*0.35*(1.0-readingMask);
  if (readingMask > 0.0) {
    nearBlocker = mix(nearBlocker,continuedGroups(readingNearUV+towardLight*0.065,nearA,nearB,readingNearMix)*0.90,readingMask);
    farBlocker = mix(farBlocker,continuedGroups(readingFarUV+towardLight*0.045,farA,farB,readingFarMix)*0.80,readingMask);
  }
  float litEdge = max(0.0,nearCloud-nearBlocker)*1.5
                +max(0.0,farCloud-farBlocker)*0.65;
  float cohesion = 0.0;
  float bodySample = nearCloud;
  float bodyShadow = nearBlocker;
  float bodyPathShadow = nearPathBlocker;
  float bodyEnvelope = 1.0;
  if (bodyWindow > 0.0) {
    cohesion = mix(cloudCohesion(nearUV+nearA),cloudCohesion(nearUV+nearB),nearMix);
    // A broad low bank and a smaller raised lobe use the plate's rounded
    // folds, rather than enlarging its smoky lower fringe. Unequal sizes,
    // heights and shared-speed currents keep the front silhouette irregular.
    float leftSpan = max(0.12,center.x-radius);
    // Keep the lobes broad even in the narrow strip left of a mobile eclipse.
    float bodySpan = max(leftSpan,radius*2.2);
    vec2 broadScale = vec2(0.53/bodySpan,0.86);
    vec2 smallScale = vec2(1.02/bodySpan,1.12);
    vec2 broadUV = (point-vec2(leftSpan*0.34,0.88)+windA)*broadScale+vec2(0.23,0.63);
    vec2 smallUV = (point-vec2(leftSpan*0.78,0.77)+windA)*smallScale+vec2(0.23,0.63);
    vec2 bodyTowardLight = normalize(-fromLight+0.0001)*radius*0.10;
    float broadBody = cumulusPlate(broadUV);
    float smallBody = cumulusPlate(smallUV)*0.66;
    float broadEnvelope = cumulusCrop(deformCloud(broadUV));
    float smallEnvelope = cumulusCrop(deformCloud(smallUV));
    bodyEnvelope = 1.0-(1.0-broadEnvelope)*(1.0-smallEnvelope);
    float smallFront = bodyOpacity(smallBody/max(0.001,smallEnvelope),1.0)*smallEnvelope;
    bodySample = mix(broadBody,smallBody,smallFront);
    // Differentiate the photographic folds, not the crop's fading boundary.
    // Otherwise that artificial boundary becomes a bright vertical rim.
    float broadShadow = cumulusShadow(broadUV,bodyTowardLight*broadScale,broadEnvelope);
    float smallShadow = cumulusShadow(smallUV,bodyTowardLight*smallScale,smallEnvelope)*0.66;
    bodyShadow = mix(broadShadow,smallShadow,smallFront);
    float broadPath = cumulusShadow(broadUV,bodyTowardLight*broadScale*2.2,broadEnvelope);
    float smallPath = cumulusShadow(smallUV,bodyTowardLight*smallScale*2.2,smallEnvelope)*0.66;
    bodyPathShadow = mix(broadPath,smallPath,smallFront);
    float solidBody = smoothstep(0.08,0.24,broadBody);
    cohesion = mix(cohesion,1.0,solidBody);
  }
  // Keep crop feathering outside the optical-density curve: saturating the
  // crop itself would expose a smooth rectangular edge around the photograph.
  float bodyAlpha = bodyOpacity(bodySample/max(0.001,bodyEnvelope),cohesion)*bodyEnvelope*bodyWindow*extensionDensity;
  float bodyBlocker = bodyOpacity(bodyShadow/max(0.001,bodyEnvelope),cohesion)*bodyEnvelope*bodyWindow;
  float transmission = exp(-(nearBlocker*1.8+farBlocker)*1.25*cloudOpacity);
  transmission *= 1.0-bodyBlocker*0.70;
  float haze = reach*illumination*0.065*(0.12+coverage*0.88);
  vec3 color = coronaOrange*haze;
  float density = clamp(farCloud*1.5+nearCloud*1.9,0.0,0.92);
  float detail = farCloud*0.52+nearCloud*0.85;
  vec3 shadowColor = mix(vec3(0.028,0.035,0.047),vec3(0.055,0.046,0.036),dawn);
  // Lift the warm midtones, rather than painting the dark cloud interiors
  // opaque brown. Existing high-frequency detail remains in the texture.
  shadowColor = mix(shadowColor,vec3(0.115,0.103,0.085),desktopAtmosphere*dawn);
  float directShare = smoothstep(0.025,0.72,directField);
  float coverVolume = 1.0-readingMask;
  vec3 cloudColor = litCloudColor(detail,litEdge,
    nearBlocker*0.85+farBlocker*0.52,nearPathBlocker*0.85+farPathBlocker*0.52,
    illumination,reach,directShare,shadowColor,coverVolume);
  // Resolve the existing near/far fields as separate surfaces. Adding their
  // luminance used to flatten the dark folds into a single translucent veil.
  float nearCohesion = mix(cloudCohesion(nearUV+nearA),cloudCohesion(nearUV+nearB),nearMix);
  float nearAlpha = bodyOpacity(nearCloud,nearCohesion)*coverage;
  float farAlpha = bodyOpacity(farCloud,0.75)*coverage;
  vec3 farColor = litCloudColor(farCloud*0.85,max(0.0,farCloud-farBlocker)*1.5,
    farBlocker*0.85,farPathBlocker*0.85,illumination,reach,directShare,shadowColor,coverVolume);
  vec3 nearColor = litCloudColor(nearCloud*0.85,max(0.0,nearCloud-nearBlocker)*1.5,
    nearBlocker*0.85,nearPathBlocker*0.85,illumination,reach,directShare,shadowColor,coverVolume);
  // The front bank casts a soft contact shadow onto the bank behind it.
  farColor *= 1.0-smoothstep(0.05,0.30,nearBlocker)*0.32;
  cloudColor = mix(cloudColor,mix(farColor,nearColor,nearAlpha),coverVolume);
  density = mix(density,1.0-(1.0-farAlpha)*(1.0-nearAlpha),coverVolume);
  // Light-facing ridges catch the corona; intervening folds stay in shadow.
  float bankRidge = max(0.0,bankCloud-bankBlocker)*3.2*(1.0-readingMask);
  float bankShade = smoothstep(0.02,0.25,bankBlocker-bankCloud)*max(bankWindow,footWindow)*(1.0-readingMask);
  cloudColor *= 1.0-bankShade*0.28;
  cloudColor += mix(coronaGold,rimIvory,0.62)*illumination*directShare*transmission
              *bankRidge*(0.45+reach*1.15);
  cloudColor += titleGold*titleLight*(0.45+detail*1.8);
  cloudColor *= cloudBrightness;
  color = mix(color,cloudColor,density);
  color += coronaGold*pow(nearCloud,1.6)*reach*illumination*0.65*cloudBrightness
           *mix(1.0,transmission*directShare*0.22,coverVolume);
  float rearAlpha = bodyOpacity(rearCloud/max(0.001,rearEnvelope),1.0)
                  *rearEnvelope*coverage*coverVolume;
  vec2 rearLightStep = normalize(-fromLight+0.0001)*rearScale*radius*0.12;
  float rearBlocker = cumulusShadow(rearUV,rearLightStep,rearEnvelope);
  float rearPathBlocker = cumulusShadow(rearUV,rearLightStep*2.2,rearEnvelope);
  vec3 rearColor = litCloudColor(rearCloud*0.85,max(0.0,rearCloud-rearBlocker)*1.5,
    rearBlocker*0.85,rearPathBlocker*0.85,illumination,reach,directShare,shadowColor,coverVolume);
  rearColor *= 1.0-smoothstep(0.06,0.32,cumulusBlocker)*0.25;
  rearColor += titleGold*titleLight*(0.45+rearCloud*1.53);
  color = mix(color,rearColor*cloudBrightness,rearAlpha);
  density = 1.0-(1.0-density)*(1.0-rearAlpha);
  // A separate front surface retains opaque folds and a readable silhouette
  // instead of adding brightness to the fine cloud field underneath it.
  float cumulusAlpha = bodyOpacity(cumulusCloud/max(0.001,cumulusEnvelope),1.0)
                     *cumulusEnvelope*coverage*(1.0-readingMask);
  float cumulusDetail = cumulusCloud*0.85;
  float cumulusRidge = max(0.0,cumulusCloud-cumulusBlocker)*1.5;
  vec3 cumulusColor = litCloudColor(cumulusDetail,cumulusRidge,
    cumulusBlocker*0.85,cumulusPathBlocker*0.85,
    illumination,reach,directShare,shadowColor,coverVolume);
  cumulusColor += titleGold*titleLight*(0.45+cumulusDetail*1.8);
  cumulusColor *= cloudBrightness;
  color = mix(color,cumulusColor,cumulusAlpha);
  density = 1.0-(1.0-density)*(1.0-cumulusAlpha);
  // Retain the combined coverage for fog occlusion and opacity diagnostics.
  cumulusAlpha = 1.0-(1.0-cumulusAlpha)*(1.0-rearAlpha);
  // Apply the 10–30% attenuation once to the combined cloud surfaces, not
  // once per layer. Preserve the clear-air glow and the separate mist veil.
  color = mix(coronaOrange*haze,color,cloudOpacity);
  density *= cloudOpacity;
  // Trade some uniformly layered veil for distinct front surfaces. Opaque
  // cores are composited after the old 90% dilution; their skirts still blend
  // into the original sky, and the shared fog remains in front of both.
  float veilRetention = 1.0-bodyWindow*0.66;
  color = mix(coronaOrange*haze,color,veilRetention);
  density *= veilRetention;
  vec3 bodyColor = litCloudColor(bodySample*0.85,
    max(0.0,bodySample-bodyShadow)*2.0,bodyShadow*0.85,bodyPathShadow*0.85,
    illumination,reach,directShare,shadowColor,coverVolume);
  bodyColor *= 1.0-smoothstep(0.01,0.15,bodyShadow-bodySample)*cohesion*0.16;
  bodyColor += titleGold*titleLight*(0.45+bodySample*1.53);
  bodyColor *= cloudBrightness;
  color = mix(color,bodyColor,bodyAlpha);
  density = 1.0-(1.0-density)*(1.0-bodyAlpha);
  // The three annotated gaps are centers, not clipping boundaries. Their
  // unequal shoulders overlap the surrounding banks, using the same source
  // folds as the two foreground layers beneath the eclipse.
  float lowerCloudMass = 0.0;
  if (readingMask < 1.0 && (uv.y > 0.64 || rightExtension > 0.001)) {
    for (int i=0; i<10; i++) {
      // Three upper shoulders, followed by three nearer bodies. Their
      // overlap gives each bank a visible step without slicing it into rows.
      float extended = i == 6 || i == 7 ? 1.0 : 0.0;
      float foot = step(7.5,float(i));
      float front = i > 5 ? mod(float(i),2.0) : step(2.5,float(i));
      float group = i > 5 ? 2.0 : mod(float(i),3.0);
      if (extended > 0.5 && rightExtension <= 0.001) continue;
      float size = group < 0.5 ? 0.55 : (group < 1.5 ? 0.88 : 0.67);
      vec2 anchor = group < 0.5 ? vec2(aspect*0.17,0.90)
                  : (group < 1.5 ? vec2(aspect*0.395,0.82) : vec2(aspect*0.90,0.82));
      // A connected lower-right foot occupies the same eclipse-relative
      // side on mobile and desktop. Two unequal shoulders fill the bottom
      // gap while the existing upper cloud remains in front.
      if (foot > 0.5) {
        anchor = vec2(center.x+radius*0.80,0.99);
        size = 0.64;
      }
      anchor += mix(vec2(radius*0.14,-0.075),vec2(-radius*0.09,0.025),front);
      size *= mix(0.70,0.92,front);
      vec2 proportions = group < 1.5 && group > 0.5 ? vec2(-0.88,1.08) : vec2(1.0,group < 0.5 ? 1.12 : 0.88);
      proportions.x *= mix(-1.0,1.0,front);
      vec2 lobeScale = cumulusScale*proportions/size;
      vec2 lobeWind = group > 1.5 ? mix(windA,windC,0.25) : windA;
      // Continue the right bank upward at its original grain scale. A fixed
      // material offset avoids stretching the photo into vertical streaks.
      vec2 lobePoint = point+vec2(0.0,radius*0.42)*extended;
      vec2 lobeUV = (lobePoint-anchor+lobeWind)*lobeScale+vec2(0.23,0.63);
      float lobeEnvelope = cumulusCrop(deformCloud(lobeUV));
      if (lobeEnvelope > 0.001) {
        float lobe = cumulusPlate(lobeUV);
        vec2 lightStep = normalize(-fromLight+0.0001)*lobeScale*radius*0.12;
        // Shade the photo's folds, not the crop's soft outer boundary.
        float blocker = cumulusShadow(lobeUV,lightStep,lobeEnvelope);
        float pathBlocker = cumulusShadow(lobeUV,lightStep*2.2,lobeEnvelope);
        float lobeAlpha = bodyOpacity(lobe/max(0.001,lobeEnvelope),1.0)*lobeEnvelope
                        *coverage*coverVolume*cloudOpacity*smoothstep(0.64,0.80,lobePoint.y)
                        *(1.0-cumulusAlpha);
        if (extended > 0.5) {
          float rootEnvelope = cumulusCrop(deformCloud((point-anchor+lobeWind)*lobeScale+vec2(0.23,0.63)));
          // Keep the root's solid folds, then feather into a translucent tip.
          lobeAlpha *= rightExtension*0.48*(1.0-rootEnvelope*0.75);
        }
        float lobeDetail = lobe*0.85;
        vec3 lobeColor = litCloudColor(lobeDetail,max(0.0,lobe-blocker)*1.5,
          blocker*0.85,pathBlocker*0.85,illumination,reach,directShare,shadowColor,coverVolume);
        lobeColor *= mix(0.84,1.08,front);
        lobeColor += titleGold*titleLight*(0.45+lobeDetail*1.8);
        color = mix(color,lobeColor*cloudBrightness,lobeAlpha);
        density = 1.0-(1.0-density)*(1.0-lobeAlpha);
        lowerCloudMass = 1.0-(1.0-lowerCloudMass)*(1.0-lobeAlpha);
      }
    }
  }
  // Front bodies occlude the haze between the banks. Keep only a thin veil
  // over these nearer surfaces so their silhouette and shading stay legible.
  float foregroundMass = max(max(bodyAlpha,cumulusAlpha),max(lowerCloudMass,nearAlpha*coverVolume)*cloudOpacity);
  transmission *= 1.0-lowerCloudMass*0.60;
  // Broad, softly broken shafts fan downward through the mist. Denser
  // intervening clouds attenuate them, leaving dark pockets between beams.
  float beamAngle = atan(fromLight.x,fromLight.y);
  float driftAngle = sin(time*0.065)*0.025;
  float beams = exp(-pow((beamAngle+0.28+driftAngle)/0.15,2.0))*0.8
              +exp(-pow((beamAngle+0.60-driftAngle)/0.10,2.0))*0.65
              +exp(-pow((beamAngle+0.92)/0.18,2.0))*0.35;
  float beamTravel = smoothstep(0.025,0.18,lightDistance)*exp(-lightDistance*0.95);
  float shafts = beams*beamTravel*transmission*illumination*smoothstep(0.0,0.16,fromLight.y)*coverage;
  float fogAlpha = fog*0.22*(0.08+coverage*0.92);
  fogAlpha *= 1.0-foregroundMass*0.80;
  vec3 fogColor = vec3(0.012,0.015,0.020)+coronaOrange*illumination*(0.015+reach*0.20);
  fogColor += coronaGold*desktopAtmosphere*illumination*(0.035+reach*0.12);
  fogColor += titleGold*titleLight*0.8;
  color = mix(color,fogColor,fogAlpha);
  color += coronaGold*shafts*(0.13+fog*0.65)*(1.0-density*0.55)
          *(1.0+desktopAtmosphere*0.65);
  color *= 1.0-smoothstep(0.42,1.0,length((atmosphereUV-0.5)*vec2(1.0,0.8)))*0.5;
  // Keep the title side quiet without hiding the cloud movement.
  color *= mix(0.52,1.0,smoothstep(0.05,0.65,uv.x)+mobile*0.6);
  color *= 1.0-smoothstep(0.91,1.04,atmosphereUV.y)*0.45;
  color /= 1.0+max(0.0,max(color.r,max(color.g,color.b))-0.75)*0.8;
  float alpha = 1.0-(1.0-haze)*(1.0-density)*(1.0-fogAlpha);
  // Increase only the two annotated rim extensions by 30%, feathering into
  // their existing banks. Preserve the unpremultiplied color as opacity rises.
  float rimOpacityGain = 1.0+0.30*max(leftExtension,rightExtension);
  float denserAlpha = min(1.0,alpha*rimOpacityGain);
  color *= denserAlpha/max(alpha,0.00001);
  alpha = denserAlpha;
  // A translucent veil covers the entire scene, including the dark disk.
  // Reuse the foreground cloud coordinates: wisps follow the same drift,
  // reversal and edge deformation instead of sliding against the clouds.
  vec2 mistBase = nearUV*vec2(aspect,1.0);
  vec2 mistA = nearA*vec2(aspect,1.0);
  vec2 mistB = nearB*vec2(aspect,1.0);
  float mistTexture = mix(mistPlate(mistBase+mistA),mistPlate(mistBase+mistB),nearMix);
  if (readingMask > 0.0) {
    vec2 lowerMistUV = readingNearUV*vec2(aspect,1.0);
    float lowerMist = mix(mistPlate(lowerMistUV+mistA),mistPlate(lowerMistUV+mistB),readingNearMix);
    mistTexture = mix(mistTexture,lowerMist,readingMask);
  }
  float diskVeil = mix(mix(0.62,1.0,smoothstep(0.65,1.20,radialDistance)),1.0,readingMask);
  float rimVeil = 1.0-0.35*exp(-pow((radialDistance-1.0)/0.12,2.0))*(1.0-readingMask);
  float mistAlpha = (0.025+mistTexture*0.40)*diskVeil*rimVeil;
  mistAlpha *= 1.0-foregroundMass*0.82;
  mistAlpha *= mix(0.3,1.0,dawn)*(1.0-smoothstep(0.92,1.04,atmosphereUV.y));
  // Thin only the wisps crossing the actual letter face, with a soft edge.
  // The surrounding mist, emission field and shared drift stay intact.
  mistAlpha *= 1.0-titleMask.g*0.40*smoothstep(0.0,0.4,titleEnergy);
  vec3 mistColor = vec3(0.23,0.225,0.20)
                 +coronaGold*illumination*(0.12+reach*0.24);
  mistColor += coronaGold*desktopAtmosphere*illumination*(0.045+reach*0.10);
  mistColor += titleGold*titleLight*2.0;
  // Reveal opacity follows the page clock; illumination still follows the
  // eclipse. Video brightness changes no longer accelerate the entrance.
  // Independent reading clouds remain immediately available.
  float cloudVisibility = mix(cloudReveal,1.0,readingMask);
  color *= cloudVisibility;
  alpha *= cloudVisibility;
  mistAlpha *= cloudVisibility;
  // Separate compositor surfaces put the outline between dense clouds and
  // this translucent veil. Both passes share one animation clock.
#ifdef FOREGROUND_MIST
  gl_FragColor = vec4(mistColor*mistAlpha,mistAlpha);
#else
  gl_FragColor = vec4(color,alpha);
#endif
}
`;

async function createAtmospherePass(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  mist: boolean,
) {
  const options: WebGLContextAttributes = {
    alpha: true,
    antialias: false,
    depth: false,
    powerPreference: 'low-power',
  };
  const gl2 = canvas.getContext('webgl2', options);
  const gl = gl2 ?? canvas.getContext('webgl', options);
  if (!gl) throw new Error('WebGL unavailable');
  const parallelCompile = gl.getExtension('KHR_parallel_shader_compile') as {
    COMPLETION_STATUS_KHR: number;
  } | null;
  const shaders: WebGLShader[] = [];
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  const texture = gl.createTexture();
  const emissionTexture = gl.createTexture();
  if (!program || !buffer || !texture || !emissionTexture)
    throw new Error('Scene allocation failed');
  const cleanupGPU = () => {
    gl.deleteTexture(texture);
    gl.deleteTexture(emissionTexture);
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    shaders.forEach((shader) => gl.deleteShader(shader));
  };
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vertex],
    [gl.FRAGMENT_SHADER, (mist ? '#define FOREGROUND_MIST\n' : '') + fragment],
  ] as const) {
    const shader = gl.createShader(type);
    if (!shader) {
      cleanupGPU();
      throw new Error('Shader unavailable');
    }
    shaders.push(shader);
    // WebGL2 provides an asynchronous GPU fence for the first displayed frame.
    // Keep the shader math identical, with only the GLSL interface updated.
    const shaderSource = gl2
      ? '#version 300 es\n' +
        (type === gl.VERTEX_SHADER
          ? source.replace('attribute vec2', 'in vec2')
          : source
              .replace(
                'precision highp float;',
                'precision highp float;\nout vec4 sceneColor;',
              )
              .replaceAll('texture2D(', 'texture(')
              .replaceAll('gl_FragColor', 'sceneColor'))
      : source;
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  // Query completion asynchronously when supported so compilation does not
  // block the page's first interactions on a cold GPU cache.
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  if (parallelCompile) {
    const started = performance.now();
    while (
      !gl.getProgramParameter(program, parallelCompile.COMPLETION_STATUS_KHR)
    ) {
      if (gl.isContextLost() || performance.now() - started > 10000) {
        cleanupGPU();
        throw new Error('Scene compilation unavailable');
      }
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
    }
  }
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const error = gl.getProgramInfoLog(program);
    cleanupGPU();
    throw new Error(error ?? 'Scene shader failed');
  }
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  const uniforms = {
    resolution: gl.getUniformLocation(program, 'resolution'),
    sceneFrame: gl.getUniformLocation(program, 'sceneFrame'),
    scrollOffset: gl.getUniformLocation(program, 'scrollOffset'),
    readingOnly: gl.getUniformLocation(program, 'readingOnly'),
    time: gl.getUniformLocation(program, 'time'),
    dawn: gl.getUniformLocation(program, 'dawn'),
    cloudReveal: gl.getUniformLocation(program, 'cloudReveal'),
    desktopAtmosphere: gl.getUniformLocation(program, 'desktopAtmosphere'),
    eclipse: gl.getUniformLocation(program, 'eclipse'),
    cloudOrigin: gl.getUniformLocation(program, 'cloudOrigin'),
    titleEnergy: gl.getUniformLocation(program, 'titleEnergy'),
    titleColor: gl.getUniformLocation(program, 'titleColor'),
  };
  gl.uniform1i(gl.getUniformLocation(program, 'clouds'), 0);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, emissionTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  // Reading pages have no title emission. A complete black texture keeps
  // sampling valid there, until the home title supplies its real light mask.
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 255]),
  );
  gl.uniform1i(gl.getUniformLocation(program, 'titleEmission'), 1);
  let fence: WebGLSync | null = null;
  let prepared = !gl2;
  if (gl2) canvas.style.visibility = 'hidden';
  return {
    canvas,
    gl,
    uniforms,
    emissionTexture,
    prepare() {
      if (!gl2 || prepared) return true;
      if (!fence) {
        fence = gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0);
        if (!fence) throw new Error('Scene preparation unavailable');
        gl2.flush();
        return false;
      }
      const status = gl2.clientWaitSync(fence, 0, 0);
      if (status === gl2.TIMEOUT_EXPIRED) return false;
      if (status === gl2.WAIT_FAILED)
        throw new Error('Scene preparation failed');
      gl2.deleteSync(fence);
      fence = null;
      prepared = true;
      canvas.style.visibility = '';
      return true;
    },
    dispose() {
      if (fence) gl2?.deleteSync(fence);
      canvas.style.visibility = '';
      cleanupGPU();
    },
  };
}

export async function createDawnRenderer(
  cloudCanvas: HTMLCanvasElement,
  mistCanvas: HTMLCanvasElement,
  host: HTMLElement,
): Promise<DawnRenderer> {
  const image = new Image();
  image.src = '/visual/atmosphere/golden-cloud-bank-v3.webp';
  await image.decode();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  const clouds = await createAtmospherePass(cloudCanvas, image, false);
  let mist: Awaited<ReturnType<typeof createAtmospherePass>>;
  try {
    mist = await createAtmospherePass(mistCanvas, image, true);
  } catch (error) {
    clouds.dispose();
    throw error;
  }
  const passes = [clouds, mist];
  let frame = 0;
  let playing = false;
  let disposed = false;
  let elapsed = 0;
  let previous = 0;
  let renderedAt = 0;
  let progress = 0;
  let revealPausedFor = 0;
  let revealPauseStarted: number | undefined;
  let revealOrigin: number | undefined;
  let resize = true;
  let prepared = false;
  let preparationStarted = false;
  let width = host.clientWidth;
  let height = host.clientHeight;
  const hero = host.closest<HTMLElement>('[data-home-hero]');
  const readingOnly = host.dataset.surface === 'reading';
  const moon = hero?.querySelector<HTMLElement>('moon-light');
  const title = hero?.querySelector<HTMLElement>('.home-hero__dawn');
  const emission = document.createElement('canvas');
  const ink = emission.getContext('2d');
  let geometryDirty = true;
  let readingProgress = 0;
  let titlePhase: string | undefined;
  let titleAnimation: Animation | undefined;
  const invalidateGeometry = () => {
    geometryDirty = true;
  };
  window.addEventListener('scroll', invalidateGeometry, { passive: true });
  void document.fonts.ready.then(invalidateGeometry);
  const titleObserver = new ResizeObserver(invalidateGeometry);
  if (title) titleObserver.observe(title);

  function updateEmission() {
    geometryDirty = false;
    if (!ink || !title || !title.firstChild) return;
    const scale = Math.min(1, 800 / Math.max(width, 1));
    emission.width = Math.max(1, Math.round(width * scale));
    emission.height = Math.max(1, Math.round(height * scale));
    const bounds = host.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(title.firstChild);
    const glyphs = range.getBoundingClientRect();
    const style = getComputedStyle(title);
    ink.scale(scale, scale);
    ink.fillStyle = '#000';
    ink.fillRect(0, 0, width, height);
    ink.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    ink.letterSpacing = style.letterSpacing;
    const text = title.firstChild.textContent?.trim() ?? 'TIL DAWN';
    const metrics = ink.measureText(text);
    const x = glyphs.x - bounds.x;
    const y = glyphs.y - bounds.y + metrics.fontBoundingBoxAscent;
    const fontSize = parseFloat(style.fontSize);
    // Letter size and the physical glow radius are independent. Keep the
    // reflected mist and outline clearance aligned with the CSS corona.
    const effectSize =
      fontSize * parseFloat(style.getPropertyValue('--dawn-effect-scale'));
    const glowSize =
      effectSize *
      parseFloat(style.getPropertyValue('--dawn-glow-scale')) *
      parseFloat(style.getPropertyValue('--dawn-glow-reach'));
    const radius =
      glowSize * parseFloat(style.getPropertyValue('--dawn-spill-scale'));
    const wideGain = parseFloat(style.getPropertyValue('--dawn-wide-gain'));
    // Match the CSS falloff: a clear nearby reflection with a quieter halo.
    ink.strokeStyle = '#f00';
    ink.lineWidth = Math.max(2, glowSize * 0.045);
    ink.filter = `blur(${radius * scale * 0.36}px)`;
    ink.strokeText(text, x, y);
    // A second, softer shell lets nearby wisps catch light beyond the glyph.
    ink.globalAlpha = 0.5 * wideGain;
    ink.lineWidth *= 1.6;
    ink.filter = `blur(${radius * scale * 0.8}px)`;
    ink.strokeText(text, x, y);
    // Green protects only the bright outline; the open interiors retain mist.
    // Additive packing
    // leaves the red light field untouched; no extra texture or frame work.
    ink.globalAlpha = 1;
    ink.globalCompositeOperation = 'lighter';
    ink.strokeStyle = '#0f0';
    ink.lineWidth = Math.max(3, effectSize * 0.028);
    ink.filter = `blur(${1.5 * scale}px)`;
    ink.strokeText(text, x, y);
    // Use the same orange-gold source for CSS glow and illuminated mist.
    const hex = style.getPropertyValue('--dawn-light-middle').trim().slice(1);
    const rgb = parseInt(hex, 16);
    for (const { gl, uniforms, emissionTexture } of passes) {
      gl.uniform3f(
        uniforms.titleColor,
        (rgb >> 16) / 255,
        ((rgb >> 8) & 255) / 255,
        (rgb & 255) / 255,
      );
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, emissionTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        emission,
      );
    }
    geometryDirty = false;
  }

  // CSS keyframe easing, evaluated from the actual animation clock. This
  // stays synchronized after pauses/seeks without per-frame style/layout reads.
  function ease(value: number, x1: number, y1: number, x2: number, y2: number) {
    let low = 0,
      high = 1;
    for (let i = 0; i < 12; i++) {
      const t = (low + high) / 2;
      const x =
        3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
      if (x < value) low = t;
      else high = t;
    }
    const t = (low + high) / 2;
    return (
      3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t
    );
  }
  function emissionEnergy() {
    const phase = hero?.dataset.titlePhase;
    if (phase !== titlePhase) {
      titlePhase = phase;
      titleAnimation = title?.getAnimations()[0];
    }
    if (phase === 'shown' || phase === 'static') return 1;
    const timing = titleAnimation?.effect?.getComputedTiming();
    const p = timing?.progress ?? 0;
    return ease(p, 0.2, 0.65, 0.25, 1);
  }
  const observer = new ResizeObserver(([entry]) => {
    if (!entry) return;
    width = entry.contentRect.width;
    height = entry.contentRect.height;
    resize = true;
  });
  observer.observe(host);
  const coverObserver = new ResizeObserver(invalidateGeometry);
  if (hero) coverObserver.observe(hero);

  function updateSceneGeometry() {
    const cover = hero?.getBoundingClientRect();
    const art = moon?.getBoundingClientRect();
    const origin = cover ? cover.top + window.scrollY : 0;
    const stage = Math.max(
      1,
      cover?.height ?? Math.min(848, Math.max(640, width * 0.53)),
    );
    const x = art ? (art.x + art.width / 2) / stage : (width * 0.73) / stage;
    const y = art
      ? (art.y + window.scrollY + art.height / 2 - origin) / stage
      : 0.42;
    const radius = art
      ? (art.width * 0.3104375) / stage
      : (width * 0.2) / stage;
    const scroll = Math.max(0, Math.min(1, window.scrollY / (origin + stage)));
    readingProgress = readingOnly ? 1 : scroll * scroll * (3 - 2 * scroll);
    for (const { gl, uniforms } of passes) {
      gl.uniform3f(
        uniforms.sceneFrame,
        width / stage,
        height / stage,
        origin / stage,
      );
      gl.uniform1f(uniforms.scrollOffset, window.scrollY / stage);
      gl.uniform1f(uniforms.readingOnly, readingOnly ? 1 : 0);
      gl.uniform2f(uniforms.cloudOrigin, x, y);
      gl.uniform3f(uniforms.eclipse, x, y, radius);
    }
  }
  function draw(now: number) {
    if (!playing || disposed) return;
    frame = requestAnimationFrame(draw);
    if (previous) elapsed += Math.min(now - previous, 100) / 1000;
    previous = now;
    // A soft, atmospheric scene needs 30 fps, not full device DPR rendering.
    if (now - renderedAt < 32) return;
    renderedAt = now;
    // A canvas commit waits for all preceding GPU commands. Prepare the first
    // frame while hidden, then poll its fence without blocking the main thread.
    // The existing CSS atmosphere remains visible until both layers are ready.
    if (preparationStarted && !prepared) {
      try {
        prepared = passes.map((pass) => pass.prepare()).every(Boolean);
      } catch {
        dispose();
        return;
      }
      if (!prepared) return;
    }
    if (resize) {
      const scale = Math.min(1.25, 1000 / Math.max(width, 1));
      const desktopAtmosphere = matchMedia('(min-width: 42.001rem)').matches;
      for (const { canvas, gl, uniforms } of passes) {
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
        gl.uniform1f(uniforms.desktopAtmosphere, desktopAtmosphere ? 1 : 0);
      }
      resize = false;
      geometryDirty = true;
    }
    if (geometryDirty) {
      updateSceneGeometry();
      updateEmission();
    }
    progress = Math.max(
      readingProgress,
      Math.min(1, Number(moon?.dataset.light ?? 0)),
    );
    const energy = emissionEnergy();
    // The reveal has to start when the canvas is first shown, not at navigation
    // start. The renderer boots after load and an idle slot, which on a phone
    // lands well past the four seconds the curve spans, so anchoring it to the
    // document clock skipped the fade entirely and the clouds arrived at full
    // strength. The dark phase has already played as the hidden still cover.
    if (prepared && revealOrigin === undefined)
      revealOrigin = performance.now() - REVEAL_DARK_MS;
    const reveal = readingOnly
      ? 1
      : revealOrigin === undefined
        ? 0
        : cloudRevealAt(performance.now() - revealOrigin - revealPausedFor);
    for (const { gl, uniforms } of passes) {
      gl.uniform1f(uniforms.time, elapsed);
      gl.uniform1f(uniforms.dawn, progress);
      gl.uniform1f(uniforms.cloudReveal, reveal);
      gl.uniform1f(uniforms.titleEnergy, energy);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    if (!prepared) {
      preparationStarted = true;
      try {
        prepared = passes.map((pass) => pass.prepare()).every(Boolean);
      } catch {
        dispose();
        return;
      }
      if (!prepared) return;
    }
    host.dataset.titleLight = energy.toFixed(3);
    host.dataset.renderer = 'webgl';
    host.dataset.dawnProgress = progress.toFixed(3);
    host.dataset.cloudReveal = reveal.toFixed(3);
    host.dataset.state =
      readingProgress === 1
        ? 'reading'
        : moon?.dataset.phase === 'loop' || moon?.dataset.fallback === 'true'
          ? 'dawn'
          : 'revealing';
  }
  const contextLost = (event: Event) => {
    event.preventDefault();
    dispose();
  };
  for (const { canvas } of passes)
    canvas.addEventListener('webglcontextlost', contextLost);
  function dispose() {
    if (disposed) return;
    disposed = true;
    playing = false;
    cancelAnimationFrame(frame);
    observer.disconnect();
    coverObserver.disconnect();
    titleObserver.disconnect();
    window.removeEventListener('scroll', invalidateGeometry);
    for (const pass of passes) {
      pass.canvas.removeEventListener('webglcontextlost', contextLost);
      pass.dispose();
    }
    delete host.dataset.renderer;
    host.dataset.state = 'still';
  }
  return {
    setPlaying(value) {
      if (disposed || value === playing) return;
      playing = value;
      previous = 0;
      if (value) {
        if (revealPauseStarted !== undefined) {
          revealPausedFor += performance.now() - revealPauseStarted;
          revealPauseStarted = undefined;
        }
        frame = requestAnimationFrame(draw);
      } else {
        revealPauseStarted = performance.now();
        cancelAnimationFrame(frame);
        host.dataset.state = 'paused';
      }
    },
    dispose,
  };
}
